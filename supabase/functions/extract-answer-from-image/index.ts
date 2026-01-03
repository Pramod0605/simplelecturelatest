import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert ArrayBuffer to base64 in chunks to avoid stack overflow
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, [...chunk]);
  }
  return btoa(binary);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_url, question_context } = await req.json();

    if (!image_url) {
      return new Response(
        JSON.stringify({ error: 'image_url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the image and convert to base64 data URL
    console.log('Fetching image from URL:', image_url.substring(0, 100) + '...');
    
    let imageDataUrl: string;
    
    // If already a data URL, use it directly
    if (image_url.startsWith('data:')) {
      imageDataUrl = image_url;
      console.log('Image is already a data URL');
    } else {
      // Fetch the image from the URL
      const imageResponse = await fetch(image_url);
      
      if (!imageResponse.ok) {
        console.error('Failed to fetch image:', imageResponse.status, imageResponse.statusText);
        return new Response(
          JSON.stringify({ error: `Failed to fetch image: ${imageResponse.status}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = arrayBufferToBase64(imageBuffer);
      
      console.log(`Image fetched successfully: ${imageBuffer.byteLength} bytes, type: ${contentType}`);
      
      // Normalize content type for the data URL
      const mimeType = contentType.split(';')[0].trim();
      imageDataUrl = `data:${mimeType};base64,${imageBase64}`;
    }

    const systemPrompt = `You are an expert at reading handwritten and typed mathematical answers from images.
Your job is to extract the EXACT answer written in the image.

Rules:
1. Extract ONLY the answer, not the question or any other text
2. Preserve mathematical notation - use LaTeX format for equations (e.g., \\frac{1}{2}, x^2, \\sqrt{3})
3. If multiple answers are visible, extract the final/main answer (usually the last one or the one that's underlined/boxed)
4. For multiple choice questions, extract just the option letter (A, B, C, D) or the full answer text
5. For numerical answers, extract the exact number including units if visible
6. If the answer is unclear or partially visible, provide your best interpretation
7. Return "UNREADABLE" only if the image is completely unreadable (too blurry, too dark, or no text visible)

Important: Return ONLY the extracted answer as plain text or LaTeX. Do not include any explanations or additional text.`;

    const userPrompt = question_context 
      ? `Extract the answer from this image. The question context is: "${question_context}"\n\nProvide only the answer, nothing else.`
      : `Extract the answer from this image. Provide only the answer, nothing else.`;

    console.log('Calling Gemini Vision API with base64 image...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: imageDataUrl } }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1, // Low temperature for more consistent extraction
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'API credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to process image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content?.trim() || '';

    console.log('Extracted text:', extractedText);

    // Determine confidence based on the response
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    
    if (extractedText === 'UNREADABLE' || extractedText === '') {
      confidence = 'low';
    } else if (extractedText.length > 0 && extractedText.length < 100) {
      // Short, clear answers are usually high confidence
      confidence = 'high';
    }

    return new Response(
      JSON.stringify({
        extracted_text: extractedText,
        confidence: confidence,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-answer-from-image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
