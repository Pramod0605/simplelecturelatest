import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, context, prompt } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get AI settings or use defaults
    const { data: aiSettings } = await supabaseClient
      .from('ai_settings')
      .select('setting_value')
      .eq('setting_key', 'question_generation')
      .maybeSingle();

    const model = aiSettings?.setting_value?.model || 'google/gemini-2.5-flash';
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'subject_description':
        systemPrompt = 'You are an expert education content writer specializing in creating concise, engaging subject descriptions for online learning platforms.';
        userPrompt = prompt || `Create a compelling, informative description for the subject "${context.subjectName}"${context.categoryName ? ` in the ${context.categoryName} category` : ''}.

The description should:
- Be between 180-200 characters (aim for 190-200 to maximize content)
- Be 1-2 well-crafted sentences
- Highlight the key value or benefit of studying this subject
- Be engaging and motivational for students
- Use clear, accessible language

CRITICAL: The description must be at least 180 characters and MAXIMUM 200 characters. Aim for 190-200 characters to provide substantive content.
Return ONLY the description text, without any headings or formatting.`;
        break;

      case 'description':
        systemPrompt = 'You are an expert course description writer. Create engaging, clear, and compelling course descriptions.';
        userPrompt = prompt || `Write a ${context.shortDescription ? 'detailed' : 'short'} description for a course named "${context.courseName}". ${context.shortDescription ? `The short description is: ${context.shortDescription}` : ''} Make it engaging and highlight the key benefits.`;
        break;
      
      case 'what_you_learn':
        systemPrompt = 'You are an expert at defining learning outcomes. List specific, actionable learning points.';
        userPrompt = prompt || `List 6-8 specific things students will learn in the course "${context.courseName}". ${context.shortDescription ? `Course description: ${context.shortDescription}` : ''} Format as a JSON array of strings. Each point should start with an action verb and be concrete.`;
        break;
      
      case 'course_includes':
        systemPrompt = 'You are an expert at describing course features and inclusions.';
        userPrompt = prompt || `List 5-7 features/inclusions for the course "${context.courseName}". ${context.shortDescription ? `Course description: ${context.shortDescription}` : ''} Format as a JSON array of objects with "icon" (lucide-react icon name like Video, Book, Clock, Award, Users, Download, MessageSquare) and "text" (feature description) properties.`;
        break;
      
      case 'faq_answer':
        systemPrompt = 'You are a helpful assistant answering frequently asked questions about courses.';
        userPrompt = prompt || `Answer this FAQ for the course "${context.courseName}": ${context.question}. ${context.shortDescription ? `Course description: ${context.shortDescription}` : ''} Keep it concise and helpful.`;
        break;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
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
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices[0].message.content;

    // Parse JSON responses for structured data
    if (type === 'what_you_learn' || type === 'course_includes') {
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
        if (jsonMatch) {
          content = JSON.parse(jsonMatch[1]);
        } else {
          content = JSON.parse(content);
        }
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        // If parsing fails, try to extract as plain text
        if (type === 'what_you_learn') {
          content = content.split('\n').filter((line: string) => line.trim().match(/^[\d\-\*]/)).map((line: string) => line.replace(/^[\d\-\*\.\)]\s*/, '').trim());
        }
      }
    }

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});