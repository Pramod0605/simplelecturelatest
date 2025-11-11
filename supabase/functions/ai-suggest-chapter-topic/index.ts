import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questionText, subjectId, subjectName, categoryName, existingChapters, existingTopics, existingSubtopics } = await req.json();

    if (!questionText || !subjectId) {
      return new Response(
        JSON.stringify({ error: 'questionText and subjectId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert educational content classifier. Analyze the question and suggest the most appropriate chapter, topic, and subtopic from the provided options. If no exact match exists, suggest a new name that would be appropriate.

Return a JSON object with this structure:
{
  "suggestedChapter": {
    "id": "uuid or null if new",
    "title": "chapter title",
    "confidence": 0.0-1.0,
    "reasoning": "explanation"
  },
  "suggestedTopic": {
    "id": "uuid or null if new",
    "title": "topic title",
    "confidence": 0.0-1.0,
    "reasoning": "explanation"
  },
  "suggestedSubtopic": {
    "id": "uuid or null if new",
    "title": "subtopic title",
    "confidence": 0.0-1.0,
    "reasoning": "explanation"
  }
}`;

    const userPrompt = `Question: ${questionText}

Subject: ${subjectName}
Category: ${categoryName}

Available Chapters:
${JSON.stringify(existingChapters || [], null, 2)}

Available Topics:
${JSON.stringify(existingTopics || [], null, 2)}

Available Subtopics:
${JSON.stringify(existingSubtopics || [], null, 2)}

Suggest the best match or propose new names if no match exists. Consider the question's content, difficulty level, and educational context.`;

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
        temperature: 0.7,
        response_format: { type: 'json_object' }
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
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const suggestions = JSON.parse(content);

    return new Response(
      JSON.stringify(suggestions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-suggest-chapter-topic:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
