import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, title, type } = await req.json();

    if (!content || !title) {
      throw new Error('Content and title are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Generating podcast for: ${title} (${type})`);

    // Use Lovable AI to generate podcast script
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an educational podcast creator. Generate an engaging podcast script that:
1. Has a conversational, friendly tone
2. Explains concepts clearly with real-world examples
3. Includes questions to encourage thinking
4. Has smooth transitions between topics
5. Includes timestamps and pacing notes

Format as structured JSON with: script, segments, duration_estimate, voice_notes.`
          },
          {
            role: 'user',
            content: `Create a podcast episode script for this ${type || 'educational'} content:

Title: ${title}

Content:
${content}

Make it conversational, engaging, and easy to follow. Include pacing notes and emphasis markers.`
          }
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Podcast script generated successfully');

    // In a real implementation, this would integrate with text-to-speech service
    // For now, return the script and metadata
    return new Response(
      JSON.stringify({
        success: true,
        script: generatedContent,
        audio_url: null, // Would be populated by actual TTS service
        metadata: {
          title,
          type,
          generated_at: new Date().toISOString(),
          status: 'script_ready',
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error generating podcast:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
