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

  let documentId: string | undefined;

  try {
    const { documentId: docId } = await req.json();
    documentId = docId;

    console.log('Processing document with Replit service:', documentId);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user) throw new Error('Unauthorized');

    // Helper functions for job tracking
    const logJobProgress = async (jobId: string, level: string, message: string, details?: any) => {
      await supabaseAdmin.from('job_logs').insert({
        job_id: jobId,
        log_level: level,
        message,
        details
      });
    };

    const updateJobProgress = async (jobId: string, percentage: number, step: string, status?: string) => {
      const update: any = {
        progress_percentage: percentage,
        current_step: step
      };
      if (status) update.status = status;

      await supabaseAdmin
        .from('document_processing_jobs')
        .update(update)
        .eq('id', jobId);
    };

    // Create job record
    const { data: job, error: jobError } = await supabaseAdmin
      .from('document_processing_jobs')
      .insert({
        document_id: documentId,
        job_type: 'mathpix_processing',
        status: 'running',
        created_by: user.id,
        started_at: new Date().toISOString(),
        progress_percentage: 0,
        current_step: 'Initializing Replit service processing'
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Job creation error:', jobError);
      throw new Error(`Failed to create job record: ${jobError?.message || 'No job returned'} - Details: ${JSON.stringify(jobError)}`);
    }

    await logJobProgress(job.id, 'info', 'Job created', { job_id: job.id });

    // Update document status
    await supabaseAdmin
      .from('uploaded_question_documents')
      .update({
        status: 'processing',
        current_job_id: job.id,
        processing_started_at: new Date().toISOString()
      })
      .eq('id', documentId);

    await updateJobProgress(job.id, 10, 'Fetching PDFs from storage');

    // Get document details
    const { data: doc, error: docError } = await supabaseAdmin
      .from('uploaded_question_documents')
      .select(`
        questions_file_name, 
        questions_file_url, 
        solutions_file_name, 
        solutions_file_url,
        category_id,
        subject_id,
        chapter_id,
        topic_id,
        subtopic_id
      `)
      .eq('id', documentId)
      .single();

    if (docError || !doc || !doc.questions_file_url || !doc.solutions_file_url) {
      throw new Error('Document not found or missing file URLs');
    }

    await logJobProgress(job.id, 'info', 'Documents fetched', { 
      questions_file: doc.questions_file_name,
      solutions_file: doc.solutions_file_name 
    });

    // Download PDFs from Supabase Storage
    const downloadFile = async (fileUrl: string, fileName: string) => {
      const urlParts = fileUrl.split('/storage/v1/object/public/');
      if (urlParts.length < 2) throw new Error('Invalid file URL format');
      const fullPath = urlParts[1];
      const storagePath = fullPath.split('/').slice(1).join('/');

      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('uploaded-question-documents')
        .download(storagePath);

      if (downloadError || !fileData) {
        throw new Error(`Failed to download ${fileName}: ${downloadError?.message}`);
      }

      return fileData;
    };

    await updateJobProgress(job.id, 20, 'Downloading PDFs');
    const questionsFile = await downloadFile(doc.questions_file_url, doc.questions_file_name);
    const solutionsFile = await downloadFile(doc.solutions_file_url, doc.solutions_file_name);

    await logJobProgress(job.id, 'info', 'PDFs downloaded successfully');

    // Upload to Replit service
    await updateJobProgress(job.id, 30, 'Uploading PDFs to Replit service');

    const formData = new FormData();
    formData.append('questions_file', questionsFile, doc.questions_file_name);
    formData.append('solutions_file', solutionsFile, doc.solutions_file_name);
    formData.append('use_llm', 'false');

    const uploadResponse = await fetch(
      'https://mathpix-ocr-llm-service-utuberpraveen.replit.app/process-educational-content',
      {
        method: 'POST',
        body: formData
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Replit service upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    const replitJobId = uploadData.job_id;

    await logJobProgress(job.id, 'info', 'PDFs uploaded to Replit', { replit_job_id: replitJobId });

    // Store Replit job ID
    await supabaseAdmin
      .from('document_processing_jobs')
      .update({
        result_data: { replit_job_id: replitJobId }
      })
      .eq('id', job.id);

    // Start background polling
    pollReplitService(
      job.id,
      replitJobId,
      documentId!,
      doc.category_id,
      doc.subject_id,
      doc.chapter_id,
      doc.topic_id,
      doc.subtopic_id,
      supabaseAdmin
    );

    await updateJobProgress(job.id, 40, 'Polling Replit service for completion');

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        replitJobId,
        message: 'Processing started, polling Replit service every 2 minutes'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    if (documentId) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );

      const { data: doc } = await supabaseAdmin
        .from('uploaded_question_documents')
        .select('current_job_id')
        .eq('id', documentId)
        .single();

      if (doc?.current_job_id) {
        await supabaseAdmin
          .from('document_processing_jobs')
          .update({
            status: 'failed',
            error_message: errorMessage,
            error_details: { error: errorMessage, stack: error instanceof Error ? error.stack : undefined },
            completed_at: new Date().toISOString()
          })
          .eq('id', doc.current_job_id);

        await supabaseAdmin.from('job_logs').insert({
          job_id: doc.current_job_id,
          log_level: 'error',
          message: 'Job failed',
          details: { error: errorMessage }
        });
      }

      await supabaseAdmin
        .from('uploaded_question_documents')
        .update({
          status: 'failed',
          error_message: errorMessage
        })
        .eq('id', documentId);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Background polling function
async function pollReplitService(
  jobId: string,
  replitJobId: string,
  documentId: string,
  categoryId: string,
  subjectId: string,
  chapterId: string,
  topicId: string | null,
  subtopicId: string | null,
  supabase: any
) {
  let attempts = 0;
  const maxAttempts = 30; // 60 minutes timeout (30 attempts * 2 minutes)
  let status = 'PROCESSING';

  while (status === 'PROCESSING' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 120000)); // 2 minutes
    attempts++;

    try {
      // Check status
      const statusResponse = await fetch(
        `https://mathpix-ocr-llm-service-utuberpraveen.replit.app/status/${replitJobId}`
      );

      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      status = statusData.status;

      await supabase.from('job_logs').insert({
        job_id: jobId,
        log_level: 'info',
        message: `Polling attempt ${attempts}: ${status}`,
        details: { replit_job_id: replitJobId }
      });

      await supabase
        .from('document_processing_jobs')
        .update({
          current_step: `Polling status (${attempts}/${maxAttempts}): ${status}`,
          progress_percentage: 40 + Math.min(40, (attempts / maxAttempts) * 40)
        })
        .eq('id', jobId);

      if (status === 'COMPLETED') {
        // Fetch final results
        const resultResponse = await fetch(
          `https://mathpix-ocr-llm-service-utuberpraveen.replit.app/api/educational-result/${replitJobId}`
        );

        if (!resultResponse.ok) {
          throw new Error(`Failed to fetch results: ${resultResponse.status}`);
        }

        const structuredData = await resultResponse.json();

        await supabase.from('job_logs').insert({
          job_id: jobId,
          log_level: 'info',
          message: 'Results fetched successfully',
          details: { 
            total_questions: structuredData.total_questions,
            matched_count: structuredData.matched_count
          }
        });

        // Parse and insert questions
        await supabase
          .from('document_processing_jobs')
          .update({
            current_step: 'Parsing questions and inserting into database',
            progress_percentage: 85
          })
          .eq('id', jobId);

        let insertedCount = 0;

        for (const item of structuredData.merged || []) {
          try {
            // Parse question text to extract options
            const questionText = item.question_text || '';
            const questionNumber = item.question_number;
            
            // Extract options using regex: (a) text (b) text (c) text (d) text
            const optionsRegex = /\(([a-d])\)\s*([^(]+?)(?=\s*\([a-d]\)|$)/gi;
            const options: Record<string, string> = {};
            let match;
            
            while ((match = optionsRegex.exec(questionText)) !== null) {
              const key = match[1]; // a, b, c, d
              const value = match[2].trim();
              options[key] = value;
            }
            
            // Clean question text (remove number and options from the end)
            let cleanQuestionText = questionText
              .replace(/^\d+\.\s*/, '') // Remove number
              .trim();
            
            // Remove options section from end if present
            const optionsStartIndex = cleanQuestionText.search(/\([a-d]\)\s*/);
            if (optionsStartIndex > -1 && Object.keys(options).length > 0) {
              cleanQuestionText = cleanQuestionText.substring(0, optionsStartIndex).trim();
            }
            
            // Determine question format
            const hasOptions = Object.keys(options).length > 0;
            const questionFormat = hasOptions ? 'single_choice' : 'short_answer';
            
            // Get solution data
            const solution = item.matched_solution;
            const correctAnswer = solution ? solution.answer_key : '';
            const explanation = solution ? solution.text : '';
            
            // Extract question images
            const questionImages = item.question_images || [];
            
            // Extract explanation images from markdown
            const explanationImages: string[] = [];
            if (explanation) {
              const imageRegex = /!\[.*?\]\((\.\/images\/[^)]+)\)/g;
              let imgMatch;
              while ((imgMatch = imageRegex.exec(explanation)) !== null) {
                explanationImages.push(imgMatch[1]);
              }
            }
            
            // Insert into parsed_questions_pending
            const { error: insertError } = await supabase
              .from('parsed_questions_pending')
              .insert({
                document_id: documentId,
                category_id: categoryId,
                subject_id: subjectId,
                chapter_id: chapterId,
                topic_id: topicId,
                subtopic_id: subtopicId,
                question_text: cleanQuestionText,
                question_format: questionFormat,
                question_type: 'mcq',
                options: hasOptions ? options : null,
                correct_answer: correctAnswer || '',
                explanation: explanation || null,
                question_images: questionImages.length > 0 ? questionImages : null,
                explanation_images: explanationImages.length > 0 ? explanationImages : null,
                contains_formula: true, // Assume true since using Mathpix
                marks: 1,
                difficulty: 'Medium'
              });

            if (insertError) {
              await supabase.from('job_logs').insert({
                job_id: jobId,
                log_level: 'warn',
                message: `Failed to insert question ${questionNumber}`,
                details: { error: insertError.message }
              });
            } else {
              insertedCount++;
            }
          } catch (parseError) {
            await supabase.from('job_logs').insert({
              job_id: jobId,
              log_level: 'error',
              message: `Error parsing question ${item.question_number}`,
              details: { error: parseError instanceof Error ? parseError.message : 'Unknown error' }
            });
          }
        }

        // Update job status to completed
        await supabase
          .from('document_processing_jobs')
          .update({
            status: 'completed',
            progress_percentage: 100,
            questions_extracted: insertedCount,
            completed_at: new Date().toISOString(),
            current_step: `Completed: ${insertedCount} questions inserted`,
            result_data: {
              replit_job_id: replitJobId,
              total_questions: structuredData.total_questions,
              matched_count: structuredData.matched_count,
              inserted_count: insertedCount
            }
          })
          .eq('id', jobId);

        // Update document status
        await supabase
          .from('uploaded_question_documents')
          .update({
            status: 'completed',
            processing_completed_at: new Date().toISOString()
          })
          .eq('id', documentId);

        await supabase.from('job_logs').insert({
          job_id: jobId,
          log_level: 'info',
          message: 'Processing completed successfully',
          details: { questions_inserted: insertedCount }
        });

        return;
      }
    } catch (error) {
      await supabase.from('job_logs').insert({
        job_id: jobId,
        log_level: 'error',
        message: `Polling error on attempt ${attempts}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  // Timeout reached
  if (status === 'PROCESSING') {
    await supabase
      .from('document_processing_jobs')
      .update({
        status: 'failed',
        error_message: 'Processing timeout after 60 minutes',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    await supabase
      .from('uploaded_question_documents')
      .update({
        status: 'failed',
        error_message: 'Processing timeout'
      })
      .eq('id', documentId);
  }
}
