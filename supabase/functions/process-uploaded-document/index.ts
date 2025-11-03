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

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id;
    }

    // Helper function to log job progress
    const logJobProgress = async (jobId: string, level: string, message: string, details?: any) => {
      await supabaseAdmin.from('job_logs').insert({
        job_id: jobId,
        log_level: level,
        message,
        details: details || null
      });
      console.log(`[${level.toUpperCase()}] ${message}`, details);
    };

    // Helper function to update job progress
    const updateJobProgress = async (jobId: string, percentage: number, step: string, data?: any) => {
      const updateData: any = {
        progress_percentage: percentage,
        current_step: step
      };
      if (data) {
        updateData.result_data = data;
      }
      await supabaseAdmin
        .from('document_processing_jobs')
        .update(updateData)
        .eq('id', jobId);
    };

    // Create job record
    const { data: job, error: jobError } = await supabaseAdmin
      .from('document_processing_jobs')
      .insert({
        document_id: documentId,
        job_type: 'mathpix_processing',
        status: 'running',
        current_step: 'Starting Mathpix processing',
        total_steps: 3,
        started_at: new Date().toISOString(),
        created_by: userId
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Update document with current job ID
    await supabaseAdmin
      .from('uploaded_question_documents')
      .update({ 
        current_job_id: job.id,
        status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', documentId);

    await logJobProgress(job.id, 'info', 'Job created, starting Mathpix processing');

    // Get Mathpix credentials
    const mathpixAppId = Deno.env.get('MATHPIX_APP_ID');
    const mathpixAppKey = Deno.env.get('MATHPIX_APP_KEY');
    
    if (!mathpixAppId || !mathpixAppKey) {
      throw new Error('Mathpix credentials not configured');
    }

    await updateJobProgress(job.id, 20, 'Fetching document and uploading to Mathpix');

    // Fetch file and convert to base64
    const fileResponse = await fetch(fileUrl);
    const fileBlob = await fileResponse.blob();
    const fileBuffer = await fileBlob.arrayBuffer();
    const base64Data = btoa(
      new Uint8Array(fileBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    await logJobProgress(job.id, 'info', 'File fetched, uploading to Mathpix');

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
      const errorText = await mathpixResponse.text();
      await logJobProgress(job.id, 'error', 'Mathpix upload failed', {
        status: mathpixResponse.status,
        error: errorText
      });
      throw new Error(`Mathpix API error: ${mathpixResponse.statusText}`);
    }

    const mathpixData = await mathpixResponse.json();
    const pdfId = mathpixData.pdf_id;

    await logJobProgress(job.id, 'info', `Mathpix processing started`, { pdf_id: pdfId });
    
    // Store Mathpix PDF ID in job
    await supabaseAdmin
      .from('document_processing_jobs')
      .update({ mathpix_pdf_id: pdfId })
      .eq('id', job.id);

    await updateJobProgress(job.id, 30, 'Polling Mathpix for completion');

    // Poll for conversion completion with timeout
    let conversionComplete = false;
    let conversionData;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max (30 * 10s)
    const startTime = Date.now();
    const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

    while (!conversionComplete && attempts < maxAttempts) {
      // Check for timeout
      if (Date.now() - startTime > TIMEOUT_MS) {
        await logJobProgress(job.id, 'error', 'Processing timeout - exceeded 10 minutes');
        throw new Error('Processing timeout - exceeded 10 minutes');
      }

      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      attempts++;
      const progress = 30 + Math.floor((attempts / maxAttempts) * 60);
      await updateJobProgress(job.id, progress, `Polling Mathpix (attempt ${attempts}/${maxAttempts})`);
      
      const statusResponse = await fetch(`https://api.mathpix.com/v3/pdf/${pdfId}`, {
        headers: {
          'app_id': mathpixAppId,
          'app_key': mathpixAppKey,
        },
      });

      if (!statusResponse.ok) {
        await logJobProgress(job.id, 'warning', `Mathpix status check failed (attempt ${attempts})`, {
          status: statusResponse.status
        });
        continue;
      }

      conversionData = await statusResponse.json();
      
      if (conversionData.status === 'completed') {
        conversionComplete = true;
        await logJobProgress(job.id, 'info', 'Mathpix processing completed', {
          pages: conversionData.num_pages || 'unknown'
        });
      } else if (conversionData.status === 'error') {
        await logJobProgress(job.id, 'error', 'Mathpix reported error', {
          error: conversionData.error
        });
        throw new Error('Mathpix conversion failed');
      }
    }

    if (!conversionComplete) {
      await logJobProgress(job.id, 'error', 'Max polling attempts reached');
      throw new Error('Mathpix conversion timeout');
    }

    await updateJobProgress(job.id, 95, 'Updating document status');

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

    // Mark job as completed
    await supabaseAdmin
      .from('document_processing_jobs')
      .update({
        status: 'completed',
        progress_percentage: 100,
        current_step: 'Processing complete',
        completed_at: new Date().toISOString(),
        result_data: {
          pdf_id: pdfId,
          pages: conversionData.num_pages || 0,
          processing_time_ms: Date.now() - startTime
        }
      })
      .eq('id', job.id);

    await logJobProgress(job.id, 'info', `Processing completed successfully in ${Math.round((Date.now() - startTime) / 1000)}s`);

    return new Response(
      JSON.stringify({ success: true, pdfId, documentId, jobId: job.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing document:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const { documentId } = await req.json().catch(() => ({ documentId: null }));
    
    if (documentId) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      // Get current job ID
      const { data: document } = await supabaseAdmin
        .from('uploaded_question_documents')
        .select('current_job_id')
        .eq('id', documentId)
        .single();

      if (document?.current_job_id) {
        await supabaseAdmin
          .from('document_processing_jobs')
          .update({
            status: 'failed',
            error_message: errorMessage,
            error_details: {
              stack: error instanceof Error ? error.stack : undefined,
              name: error instanceof Error ? error.name : 'Error',
              timestamp: new Date().toISOString()
            },
            completed_at: new Date().toISOString()
          })
          .eq('id', document.current_job_id);

        await supabaseAdmin.from('job_logs').insert({
          job_id: document.current_job_id,
          log_level: 'error',
          message: `Processing failed: ${errorMessage}`,
          details: {
            error_type: error instanceof Error ? error.name : 'Error',
            stack: error instanceof Error ? error.stack : undefined
          }
        });
      }
      
      await supabaseAdmin
        .from('uploaded_question_documents')
        .update({
          status: 'failed',
          error_message: errorMessage
        })
        .eq('id', documentId);
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});