import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, fileUrl } = await req.json();
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update status to processing
    await supabaseAdmin
      .from('uploaded_question_documents')
      .update({ 
        status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', documentId);

    // Get Mathpix credentials
    const mathpixAppId = Deno.env.get('MATHPIX_APP_ID');
    const mathpixAppKey = Deno.env.get('MATHPIX_APP_KEY');
    
    if (!mathpixAppId || !mathpixAppKey) {
      throw new Error('Mathpix credentials not configured');
    }

    // Fetch file and convert to base64
    const fileResponse = await fetch(fileUrl);
    const fileBlob = await fileResponse.blob();
    const fileBuffer = await fileBlob.arrayBuffer();
    const base64Data = btoa(
      new Uint8Array(fileBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // Call Mathpix API to upload PDF
    const mathpixResponse = await fetch('https://api.mathpix.com/v3/pdf', {
      method: 'POST',
      headers: {
        'app_id': mathpixAppId,
        'app_key': mathpixAppKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        src: `data:application/pdf;base64,${base64Data}`,
        formats: ['markdown', 'latex_styled', 'html', 'text']
      }),
    });

    if (!mathpixResponse.ok) {
      throw new Error(`Mathpix API error: ${mathpixResponse.statusText}`);
    }

    const mathpixData = await mathpixResponse.json();
    const pdfId = mathpixData.pdf_id;

    // Poll for conversion completion
    let conversionComplete = false;
    let conversionData;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max (30 * 10s)

    while (!conversionComplete && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      const statusResponse = await fetch(`https://api.mathpix.com/v3/pdf/${pdfId}`, {
        headers: {
          'app_id': mathpixAppId,
          'app_key': mathpixAppKey,
        },
      });

      conversionData = await statusResponse.json();
      
      if (conversionData.status === 'completed') {
        conversionComplete = true;
      } else if (conversionData.status === 'error') {
        throw new Error('Mathpix conversion failed');
      }
      
      attempts++;
    }

    if (!conversionComplete) {
      throw new Error('Mathpix conversion timeout');
    }

    // Update document with Mathpix output
    await supabaseAdmin
      .from('uploaded_question_documents')
      .update({
        mathpix_pdf_id: pdfId,
        mathpix_json_output: conversionData,
        mathpix_markdown: conversionData.markdown || conversionData.text,
        mathpix_latex: conversionData.latex_styled,
        mathpix_html: conversionData.html,
        status: 'completed',
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', documentId);

    return new Response(
      JSON.stringify({ success: true, pdfId, documentId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing document:', error);
    
    const { documentId } = await req.json().catch(() => ({ documentId: null }));
    if (documentId) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseAdmin
        .from('uploaded_question_documents')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', documentId);
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
