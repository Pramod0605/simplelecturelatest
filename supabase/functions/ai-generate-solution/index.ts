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
    const { questionId } = await req.json();
    console.log('Generating solution for question:', questionId);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch question details
    const { data: question, error: questionError } = await supabaseClient
      .from('parsed_questions_pending')
      .select('*')
      .eq('id', questionId)
      .single();

    if (questionError) throw questionError;

    // Use Lovable AI to generate solution
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `You are an expert educator. Generate a clear, step-by-step solution for the following question:

Question: ${question.question_text}

Question Type: ${question.question_format}
Difficulty: ${question.difficulty}
${question.options ? `Options: ${JSON.stringify(question.options)}` : ''}
Correct Answer: ${question.correct_answer}

Provide a detailed explanation that:
1. Explains the concept involved
2. Shows step-by-step working
3. Explains why the correct answer is right
4. If applicable, explains why other options are wrong

Format the solution clearly with numbered steps and explanations.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert educator who provides clear, detailed explanations.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedSolution = aiData.choices[0].message.content;

    // Update question with generated solution
    const { error: updateError } = await supabaseClient
      .from('parsed_questions_pending')
      .update({
        explanation: generatedSolution,
        updated_at: new Date().toISOString()
      })
      .eq('id', questionId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        solution: generatedSolution 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating solution:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
