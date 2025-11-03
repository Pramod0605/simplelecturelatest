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

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id;
    }

    // Helper functions
    const logJobProgress = async (jobId: string, level: string, message: string, details?: any) => {
      await supabaseAdmin.from('job_logs').insert({
        job_id: jobId,
        log_level: level,
        message,
        details: details || null
      });
      console.log(`[${level.toUpperCase()}] ${message}`, details);
    };

    const updateJobProgress = async (jobId: string, percentage: number, step: string, data?: any) => {
      const updateData: any = {
        progress_percentage: percentage,
        current_step: step
      };
      if (data) {
        updateData.result_data = data;
      }
      await supabaseAdmin
        .from('document_processing_jobs')
        .update(updateData)
        .eq('id', jobId);
    };

    // Create job record
    const { data: job, error: jobError } = await supabaseAdmin
      .from('document_processing_jobs')
      .insert({
        document_id: documentId,
        job_type: 'llm_extraction',
        status: 'running',
        current_step: 'Starting question extraction',
        total_steps: 2,
        started_at: new Date().toISOString(),
        created_by: userId
      })
      .select()
      .single();

    if (jobError) throw jobError;

    await logJobProgress(job.id, 'info', 'Starting LLM question extraction');

    // Fetch document
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('uploaded_question_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;
    if (!document.mathpix_markdown) throw new Error('Document not processed yet');

    await updateJobProgress(job.id, 20, 'Document fetched, preparing for extraction');

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

    await updateJobProgress(job.id, 40, 'Calling AI to extract questions');
    await logJobProgress(job.id, 'info', 'Invoking AI extraction');

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
      const errorText = await aiResponse.text();
      await logJobProgress(job.id, 'error', 'AI extraction failed', {
        status: aiResponse.status,
        error: errorText
      });
      throw new Error(`AI API error: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const extractedData = JSON.parse(aiData.choices[0].message.content);
    const questions = extractedData.questions || [];

    await logJobProgress(job.id, 'info', `Extracted ${questions.length} questions`);
    await updateJobProgress(job.id, 70, `Saving ${questions.length} questions to database`);

    // Insert questions into pending table
    let insertedCount = 0;
    const difficultyDistribution: any = { Low: 0, Medium: 0, Intermediate: 0, Advanced: 0 };

    const questionRecords = questions.map((q: any) => {
      if (q.difficulty) {
        difficultyDistribution[q.difficulty]++;
      }
      return {
        document_id: documentId,
        category_id: document.category_id,
        subject_id: document.subject_id,
        chapter_id: document.chapter_id,
        topic_id: document.topic_id,
        subtopic_id: document.subtopic_id,
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
      };
    });

    const { error: insertError } = await supabaseAdmin
      .from('parsed_questions_pending')
      .insert(questionRecords);

    if (insertError) {
      await logJobProgress(job.id, 'error', 'Failed to insert questions', {
        error: insertError.message
      });
      throw insertError;
    }

    insertedCount = questionRecords.length;

    await updateJobProgress(job.id, 95, 'Finalizing extraction');

    // Mark job as completed
    await supabaseAdmin
      .from('document_processing_jobs')
      .update({
        status: 'completed',
        progress_percentage: 100,
        current_step: 'Extraction complete',
        completed_at: new Date().toISOString(),
        questions_extracted: insertedCount,
        result_data: {
          total_questions: insertedCount,
          difficulty_distribution: difficultyDistribution
        }
      })
      .eq('id', job.id);

    await logJobProgress(job.id, 'info', `Extraction completed: ${insertedCount} questions saved`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        questionsExtracted: insertedCount,
        documentId,
        jobId: job.id,
        difficultyDistribution
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error extracting questions:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const { documentId } = await req.json().catch(() => ({ documentId: null }));

    if (documentId) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Get current running job
      const { data: jobs } = await supabaseAdmin
        .from('document_processing_jobs')
        .select('id')
        .eq('document_id', documentId)
        .eq('job_type', 'llm_extraction')
        .eq('status', 'running')
        .order('created_at', { ascending: false })
        .limit(1);

      if (jobs && jobs.length > 0) {
        const jobId = jobs[0].id;
        await supabaseAdmin
          .from('document_processing_jobs')
          .update({
            status: 'failed',
            error_message: errorMessage,
            error_details: {
              stack: error instanceof Error ? error.stack : undefined,
              name: error instanceof Error ? error.name : 'Error'
            },
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId);

        await supabaseAdmin.from('job_logs').insert({
          job_id: jobId,
          log_level: 'error',
          message: `Extraction failed: ${errorMessage}`,
          details: { 
            error_type: error instanceof Error ? error.name : 'Error',
            stack: error instanceof Error ? error.stack : undefined 
          }
        });
      }
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});