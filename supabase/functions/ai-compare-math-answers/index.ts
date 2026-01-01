import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComparisonItem {
  id: string;
  user_answer: string;
  correct_answer: string;
}

interface ComparisonResult {
  id: string;
  is_equivalent: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items } = await req.json() as { items: ComparisonItem[] };
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No items provided for comparison' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the prompt for batch comparison
    const comparisonsText = items.map((item, idx) => 
      `${idx + 1}. ID: "${item.id}"\n   User Answer: "${item.user_answer}"\n   Correct Answer: "${item.correct_answer}"`
    ).join('\n\n');

    const systemPrompt = `You are a math answer equivalence checker. Your ONLY job is to determine if two mathematical answers are equivalent.

Rules:
- Treat LaTeX notation and plain text as equivalent (e.g., "$5^2$" equals "5^2" equals "5²" equals "25")
- Treat fractions and decimals as equivalent (e.g., "1/2" equals "0.5")
- Treat different notations as equivalent (e.g., "×" equals "*", "÷" equals "/")
- Ignore whitespace differences
- Ignore case differences for variables
- Consider mathematical equivalence (e.g., "2x" equals "x*2" equals "x+x")
- DO NOT solve problems - only compare the given answers
- If answers are mathematically the same value or expression, they are equivalent

Respond with a JSON object containing a "results" array with objects having "id" and "is_equivalent" (boolean) for each comparison.`;

    const userPrompt = `Compare each pair of answers and determine if they are mathematically equivalent:

${comparisonsText}

Respond ONLY with valid JSON in this exact format:
{"results": [{"id": "...", "is_equivalent": true/false}, ...]}`;

    console.log(`Comparing ${items.length} answer pairs via AI`);

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
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'Invalid AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response from the AI
    let parsedResults: { results: ComparisonResult[] };
    try {
      // Extract JSON from potential markdown code blocks
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }
      parsedResults = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content, parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI comparison results:', parsedResults);

    return new Response(
      JSON.stringify(parsedResults),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-compare-math-answers:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
