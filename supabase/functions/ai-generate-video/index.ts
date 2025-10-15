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

    console.log(`Generating video for: ${title} (${type})`);

    // Use Lovable AI to generate video script and metadata
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
            content: `You are an educational content creator. Generate a detailed video script for educational content.
Include:
1. Engaging introduction (30 seconds)
2. Main content broken into clear sections with timestamps
3. Visual descriptions for each section
4. Conclusion with key takeaways
5. Suggested visuals, animations, and diagrams

Format the response as structured JSON with: script, sections, visuals, duration_estimate.`
          },
          {
            role: 'user',
            content: `Create a video script for this ${type || 'educational'} content:

Title: ${title}

Content:
${content}

Make it engaging, clear, and suitable for students. Include timestamps and visual suggestions.`
          }
        ],
        temperature: 0.7,
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

    console.log('Video script generated successfully');

    // In a real implementation, this would integrate with a video generation service
    // For now, return the script and metadata
    return new Response(
      JSON.stringify({
        success: true,
        script: generatedContent,
        video_url: null, // Would be populated by actual video generation service
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
    console.error('Error generating video:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
