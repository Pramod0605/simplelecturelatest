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
    const { subjectName, categoryName, numberOfChapters = 10 } = await req.json();
    
    if (!subjectName) {
      return new Response(
        JSON.stringify({ error: "Subject name is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert curriculum designer. Generate a comprehensive chapter structure for educational content.

Your output MUST be valid JSON following this exact structure:
{
  "chapters": [
    {
      "chapter_number": 1,
      "title": "Chapter Title",
      "description": "Brief description",
      "topics": [
        {
          "topic_number": 1,
          "title": "Topic Title",
          "estimated_duration_minutes": 60,
          "content_markdown": "Brief content overview",
          "subtopics": [
            {
              "title": "Subtopic Title",
              "description": "Brief description",
              "estimated_duration_minutes": 30,
              "sequence_order": 1
            }
          ]
        }
      ]
    }
  ]
}

Requirements:
- Generate ${numberOfChapters} chapters
- Each chapter should have 3-5 topics
- Each topic should have 2-4 subtopics
- Follow standard curriculum progression (basic to advanced)
- Include appropriate duration estimates
- Make content academically accurate`;

    const userPrompt = `Generate a comprehensive curriculum structure for "${subjectName}"${categoryName ? ` in the context of ${categoryName}` : ''}.

Follow standard educational curriculum guidelines and ensure logical progression from foundational to advanced concepts.`;

    console.log('Generating curriculum for:', subjectName);

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
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_curriculum',
              description: 'Generate structured curriculum with chapters, topics, and subtopics',
              parameters: {
                type: 'object',
                properties: {
                  chapters: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        chapter_number: { type: 'integer' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        topics: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              topic_number: { type: 'integer' },
                              title: { type: 'string' },
                              estimated_duration_minutes: { type: 'integer' },
                              content_markdown: { type: 'string' },
                              subtopics: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    estimated_duration_minutes: { type: 'integer' },
                                    sequence_order: { type: 'integer' }
                                  },
                                  required: ['title', 'description', 'estimated_duration_minutes', 'sequence_order'],
                                  additionalProperties: false
                                }
                              }
                            },
                            required: ['topic_number', 'title', 'estimated_duration_minutes'],
                            additionalProperties: false
                          }
                        }
                      },
                      required: ['chapter_number', 'title', 'description', 'topics'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['chapters'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_curriculum' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Response received');

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      throw new Error('No curriculum data generated');
    }

    const curriculum = JSON.parse(toolCall.function.arguments);
    
    console.log(`Generated ${curriculum.chapters?.length || 0} chapters`);

    return new Response(
      JSON.stringify({
        success: true,
        curriculum: curriculum.chapters || [],
        metadata: {
          subject: subjectName,
          category: categoryName,
          generatedAt: new Date().toISOString(),
          chaptersCount: curriculum.chapters?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-generate-curriculum:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate curriculum',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
