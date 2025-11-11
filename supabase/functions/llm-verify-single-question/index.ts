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
    console.log('Verifying question with LLM:', questionId);

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const verificationPrompt = `Verify the following educational question for correctness and quality:

Question: ${question.question_text}
Type: ${question.question_format}
${question.options ? `Options: ${JSON.stringify(question.options)}` : ''}
Correct Answer: ${question.correct_answer}
${question.explanation ? `Solution: ${question.explanation}` : ''}

Evaluate:
1. Is the question clear and well-formed?
2. Are the options (if any) distinct and appropriate?
3. Is the correct answer accurate?
4. Is the solution (if provided) correct and clear?
5. Are there any mathematical, factual, or logical errors?

Respond ONLY with a JSON object in this exact format:
{
  "status": "correct" | "medium" | "wrong",
  "confidence": 0.0-1.0,
  "comments": "brief explanation",
  "issues": ["list", "of", "issues"] or []
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert educator who verifies educational content for accuracy. Always respond with valid JSON only.' },
          { role: 'user', content: verificationPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI verification failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }
    
    const verification = JSON.parse(jsonMatch[0]);

    // Update question with verification results
    const { error: updateError } = await supabaseClient
      .from('parsed_questions_pending')
      .update({
        llm_verification_status: verification.status,
        llm_confidence_score: verification.confidence,
        llm_verification_comments: verification.comments,
        llm_issues: verification.issues,
        llm_verified_at: new Date().toISOString(),
        llm_verified: true
      })
      .eq('id', questionId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ 
        success: true,
        verification 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error verifying question:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
