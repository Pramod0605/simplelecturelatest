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
    const { documentId } = await req.json();
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch document
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('uploaded_question_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;
    if (!document.mathpix_markdown) throw new Error('Document not processed yet');

    // Call AI to extract questions
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) throw new Error('AI API key not configured');

    const systemPrompt = `You are an expert at parsing educational questions from documents.

For each question you extract:
1. Extract question text, options, correct answer, explanation
2. Identify question format (single_choice, multiple_choice, true_false, fill_blank, short_answer)
3. **AUTO-DETECT DIFFICULTY LEVEL**:
   - Analyze question complexity, concepts, reasoning required
   - Assign one of: "Low", "Medium", "Intermediate", "Advanced"
   - Provide brief reasoning (1 sentence)

Difficulty Criteria:
- **Low**: Basic recall, simple facts, direct definitions
- **Medium**: Application of single concept, straightforward problem-solving
- **Intermediate**: Multi-step reasoning, combining 2-3 concepts, moderate complexity
- **Advanced**: Complex analysis, advanced concepts, multi-layered reasoning, requires deep understanding

Return JSON array:
{
  "questions": [
    {
      "question_text": "...",
      "question_format": "single_choice",
      "question_type": "objective",
      "difficulty": "Medium",
      "difficulty_reasoning": "Requires understanding of basic physics principles",
      "marks": 1,
      "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
      "correct_answer": "A",
      "explanation": "..."
    }
  ]
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extract questions from this document:\n\n${document.mathpix_markdown}` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const extractedData = JSON.parse(aiData.choices[0].message.content);
    const questions = extractedData.questions || [];

    // Insert questions into pending table
    const questionRecords = questions.map((q: any) => ({
      document_id: documentId,
      category_id: document.category_id,
      subject_id: document.subject_id,
      chapter_id: document.chapter_id,
      topic_id: document.topic_id,
      subtopic_id: document.subtopic_id, // Add subtopic support
      question_text: q.question_text,
      question_format: q.question_format || 'single_choice',
      question_type: q.question_type || 'objective',
      difficulty: q.difficulty || 'Medium',
      marks: q.marks || 1,
      options: q.options || {},
      correct_answer: q.correct_answer,
      explanation: q.explanation || '',
      llm_suggested_difficulty: q.difficulty,
      llm_difficulty_reasoning: q.difficulty_reasoning
    }));

    const { error: insertError } = await supabaseAdmin
      .from('parsed_questions_pending')
      .insert(questionRecords);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        questionsExtracted: questions.length,
        documentId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error extracting questions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
