import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as zipjs from "https://deno.land/x/zipjs@v2.7.52/index.js";

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

    console.log('Processing dual-PDF document:', documentId);

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
        current_step: 'Initializing Mathpix processing'
      })
      .select()
      .single();

    if (jobError || !job) {
      throw new Error('Failed to create job record');
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

    await updateJobProgress(job.id, 10, 'Fetching dual PDFs from storage');

    // Get document details including both file URLs
    const { data: doc } = await supabaseAdmin
      .from('uploaded_question_documents')
      .select(`
        questions_file_name, 
        questions_file_url, 
        solutions_file_name, 
        solutions_file_url, 
        chapter_id, 
        topic_id,
        subject_chapters!inner(title),
        subject_topics!inner(title)
      `)
      .eq('id', documentId)
      .single();

    if (!doc || !doc.questions_file_url || !doc.solutions_file_url) {
      throw new Error('Document not found or missing file URLs');
    }

    await logJobProgress(job.id, 'info', 'Documents fetched', { 
      questions_file: doc.questions_file_name,
      solutions_file: doc.solutions_file_name 
    });

    const mathpixAppId = Deno.env.get('MATHPIX_APP_ID');
    const mathpixAppKey = Deno.env.get('MATHPIX_APP_KEY');

    if (!mathpixAppId || !mathpixAppKey) {
      throw new Error('Mathpix API credentials not configured');
    }

    // Helper to extract storage path and download file
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

    // Helper to upload PDF to Mathpix
    const uploadToMathpix = async (fileData: Blob, fileName: string) => {
      const fileBuffer = await fileData.arrayBuffer();
      const blob = new Blob([fileBuffer], { type: 'application/pdf' });

      const formData = new FormData();
      formData.append('file', blob, fileName);

      const response = await fetch('https://api.mathpix.com/v3/pdf', {
        method: 'POST',
        headers: {
          'app_id': mathpixAppId,
          'app_key': mathpixAppKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mathpix API error for ${fileName}: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error || data.error_info) {
        throw new Error(`Mathpix API error for ${fileName}: ${JSON.stringify(data.error || data.error_info)}`);
      }

      const pdfId = data.pdf_id || data.id || data.request_id;
      if (!pdfId) {
        throw new Error(`No PDF ID returned for ${fileName}`);
      }

      return pdfId;
    };

    // Download both PDFs
    await updateJobProgress(job.id, 20, 'Downloading questions PDF');
    const questionsFile = await downloadFile(doc.questions_file_url, doc.questions_file_name);
    
    await updateJobProgress(job.id, 25, 'Downloading solutions PDF');
    const solutionsFile = await downloadFile(doc.solutions_file_url, doc.solutions_file_name);

    await logJobProgress(job.id, 'info', 'Both PDFs downloaded successfully');

    // Upload both PDFs to Mathpix
    await updateJobProgress(job.id, 30, 'Uploading questions PDF to Mathpix');
    const questionsPdfId = await uploadToMathpix(questionsFile, doc.questions_file_name);
    
    await updateJobProgress(job.id, 35, 'Uploading solutions PDF to Mathpix');
    const solutionsPdfId = await uploadToMathpix(solutionsFile, doc.solutions_file_name);

    await logJobProgress(job.id, 'info', 'Both PDFs uploaded to Mathpix', {
      questions_pdf_id: questionsPdfId,
      solutions_pdf_id: solutionsPdfId
    });

    // Store both PDF IDs
    await supabaseAdmin
      .from('document_processing_jobs')
      .update({
        mathpix_pdf_id: questionsPdfId,
        result_data: { solutions_pdf_id: solutionsPdfId }
      })
      .eq('id', job.id);

    await supabaseAdmin
      .from('uploaded_question_documents')
      .update({
        mathpix_questions_pdf_id: questionsPdfId,
        mathpix_solutions_pdf_id: solutionsPdfId
      })
      .eq('id', documentId);

    // Start background polling for both PDFs
    pollMathpixDualCompletion(
      job.id,
      questionsPdfId,
      solutionsPdfId,
      documentId!,
      supabaseAdmin,
      (doc.subject_chapters as any)?.title,
      (doc.subject_topics as any)?.title
    );

    await updateJobProgress(job.id, 40, 'Dual PDF processing started');

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        questionsPdfId,
        solutionsPdfId,
        message: 'Dual PDF processing started in background'
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

      // Get current job ID
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

// ZIP extraction helper function
async function extractMmdZipAndUpload(
  pdfId: string,
  pdfType: 'questions' | 'solutions',
  documentId: string,
  appId: string,
  appKey: string,
  supabase: any,
  jobId: string
): Promise<{ mmdContent: string; imageMetadata: Array<any> }> {
  const zipUrl = `https://api.mathpix.com/v3/pdf/${pdfId}.mmd.zip`;

  // Download ZIP file
  const zipResponse = await fetch(zipUrl, {
    headers: { app_id: appId, app_key: appKey }
  });

  if (!zipResponse.ok) {
    throw new Error(`Failed to download ZIP for ${pdfType}: ${zipResponse.status}`);
  }

  const zipBytes = new Uint8Array(await zipResponse.arrayBuffer());
  const blob = new Blob([zipBytes]);
  
  const reader = new zipjs.ZipReader(new zipjs.BlobReader(blob));
  const entries = await reader.getEntries();

  let mmdContent = '';
  const imageMetadata: Array<any> = [];

  for (const entry of entries) {
    if (entry.filename.toLowerCase().endsWith('.mmd')) {
      const writer = new zipjs.TextWriter();
      mmdContent = await entry.getData!(writer);
      
      await supabase.from('job_logs').insert({
        job_id: jobId,
        log_level: 'info',
        message: `Extracted MMD for ${pdfType}`,
        details: { filename: entry.filename, length: mmdContent.length }
      });
    } else if (/\.(png|jpg|jpeg)$/i.test(entry.filename)) {
      const writer = new zipjs.BlobWriter();
      const blobData = await entry.getData!(writer);
      
      // Upload to Supabase Storage
      const imagePath = `${documentId}/${pdfType}/${entry.filename}`;
      const { error: uploadError } = await supabase.storage
        .from('questions-images')
        .upload(imagePath, blobData, { contentType: blobData.type, upsert: true });

      if (uploadError) {
        await supabase.from('job_logs').insert({
          job_id: jobId,
          log_level: 'warn',
          message: `Failed to upload image ${entry.filename}`,
          details: { error: uploadError.message }
        });
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from('questions-images')
        .getPublicUrl(imagePath);

      imageMetadata.push({
        document_id: documentId,
        image_type: pdfType === 'questions' ? 'question' : 'solution',
        original_filename: entry.filename,
        storage_url: publicUrlData.publicUrl
      });

      await supabase.from('job_logs').insert({
        job_id: jobId,
        log_level: 'info',
        message: `Uploaded image for ${pdfType}`,
        details: { filename: entry.filename, url: publicUrlData.publicUrl }
      });
    }
  }

  await reader.close();

  if (!mmdContent) {
    throw new Error(`No MMD content found in ZIP for ${pdfType}`);
  }

  return { mmdContent, imageMetadata };
}

// Background polling function for dual PDF conversion
async function pollMathpixDualCompletion(
  jobId: string,
  questionsPdfId: string,
  solutionsPdfId: string,
  documentId: string,
  supabase: any,
  chapterTitle?: string,
  topicTitle?: string
) {
  const mathpixAppId = Deno.env.get('MATHPIX_APP_ID')!;
  const mathpixAppKey = Deno.env.get('MATHPIX_APP_KEY')!;

  let attempts = 0;
  const maxAttempts = 60;

  let questionsCompleted = false;
  let solutionsCompleted = false;
  let questionsMmdContent = '';
  let solutionsMmdContent = '';
  const allImageMetadata: Array<any> = [];

  while (attempts < maxAttempts && (!questionsCompleted || !solutionsCompleted)) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    attempts++;

    try {
      // Check questions PDF
      if (!questionsCompleted) {
        const qResponse = await fetch(`https://api.mathpix.com/v3/pdf/${questionsPdfId}`, {
          headers: { app_id: mathpixAppId, app_key: mathpixAppKey }
        });

        if (qResponse.ok) {
          const qData = await qResponse.json();
          
          await supabase.from('job_logs').insert({
            job_id: jobId,
            log_level: 'info',
            message: `Questions PDF status: ${qData.status}`,
            details: { pdf_id: questionsPdfId, attempt: attempts }
          });

          if (qData.status === 'completed') {
            const { mmdContent, imageMetadata } = await extractMmdZipAndUpload(
              questionsPdfId,
              'questions',
              documentId,
              mathpixAppId,
              mathpixAppKey,
              supabase,
              jobId
            );
            questionsMmdContent = mmdContent;
            allImageMetadata.push(...imageMetadata);
            questionsCompleted = true;

            await supabase.from('job_logs').insert({
              job_id: jobId,
              log_level: 'info',
              message: 'Questions PDF completed',
              details: { images_extracted: imageMetadata.length }
            });
          } else if (qData.status === 'error') {
            throw new Error(`Questions PDF conversion failed: ${qData.error}`);
          }
        }
      }

      // Check solutions PDF
      if (!solutionsCompleted) {
        const sResponse = await fetch(`https://api.mathpix.com/v3/pdf/${solutionsPdfId}`, {
          headers: { app_id: mathpixAppId, app_key: mathpixAppKey }
        });

        if (sResponse.ok) {
          const sData = await sResponse.json();
          
          await supabase.from('job_logs').insert({
            job_id: jobId,
            log_level: 'info',
            message: `Solutions PDF status: ${sData.status}`,
            details: { pdf_id: solutionsPdfId, attempt: attempts }
          });

          if (sData.status === 'completed') {
            const { mmdContent, imageMetadata } = await extractMmdZipAndUpload(
              solutionsPdfId,
              'solutions',
              documentId,
              mathpixAppId,
              mathpixAppKey,
              supabase,
              jobId
            );
            solutionsMmdContent = mmdContent;
            allImageMetadata.push(...imageMetadata);
            solutionsCompleted = true;

            await supabase.from('job_logs').insert({
              job_id: jobId,
              log_level: 'info',
              message: 'Solutions PDF completed',
              details: { images_extracted: imageMetadata.length }
            });
          } else if (sData.status === 'error') {
            throw new Error(`Solutions PDF conversion failed: ${sData.error}`);
          }
        }
      }

      // Update progress
      const completionPercent = ((questionsCompleted ? 1 : 0) + (solutionsCompleted ? 1 : 0)) / 2;
      await supabase
        .from('document_processing_jobs')
        .update({
          progress_percentage: 40 + Math.floor(completionPercent * 50),
          current_step: `Processing: Questions ${questionsCompleted ? '✓' : '...'} | Solutions ${solutionsCompleted ? '✓' : '...'}`
        })
        .eq('id', jobId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await supabase.from('job_logs').insert({
        job_id: jobId,
        log_level: 'error',
        message: `Polling error on attempt ${attempts}`,
        details: { error: errorMessage }
      });

      if (errorMessage.includes('conversion failed')) {
        await supabase
          .from('document_processing_jobs')
          .update({
            status: 'failed',
            error_message: errorMessage,
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId);

        await supabase
          .from('uploaded_question_documents')
          .update({ status: 'failed', error_message: errorMessage })
          .eq('id', documentId);

        return;
      }
    }
  }

  // Check if both completed
  if (questionsCompleted && solutionsCompleted) {
    // Insert image metadata
    if (allImageMetadata.length > 0) {
      await supabase.from('document_images').insert(allImageMetadata);
    }

    // Validate MMD content against chapter/topic
    const validationResults: any = {};
    if (chapterTitle) {
      validationResults.chapter_match = questionsMmdContent.toLowerCase().includes(chapterTitle.toLowerCase());
    }
    if (topicTitle) {
      validationResults.topic_match = questionsMmdContent.toLowerCase().includes(topicTitle.toLowerCase());
    }

    const validationStatus = (!chapterTitle || validationResults.chapter_match) && 
                            (!topicTitle || validationResults.topic_match) ? 'valid' : 'mismatch';

    // Store results
    await supabase
      .from('uploaded_question_documents')
      .update({
        questions_mmd_content: questionsMmdContent,
        solutions_mmd_content: solutionsMmdContent,
        validation_status: validationStatus,
        validation_details: validationResults,
        status: 'completed',
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', documentId);

    await supabase
      .from('document_processing_jobs')
      .update({
        status: 'completed',
        progress_percentage: 100,
        current_step: 'Dual PDF processing complete',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    await supabase.from('job_logs').insert({
      job_id: jobId,
      log_level: 'info',
      message: 'Dual PDF processing completed successfully',
      details: {
        questions_length: questionsMmdContent.length,
        solutions_length: solutionsMmdContent.length,
        images_extracted: allImageMetadata.length,
        validation_status: validationStatus
      }
    });
  } else {
    // Timeout
    const timeoutMessage = `Timeout after ${attempts} attempts. Questions: ${questionsCompleted ? '✓' : '✗'}, Solutions: ${solutionsCompleted ? '✓' : '✗'}`;
    
    await supabase
      .from('document_processing_jobs')
      .update({
        status: 'failed',
        error_message: timeoutMessage,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    await supabase
      .from('uploaded_question_documents')
      .update({ status: 'failed', error_message: timeoutMessage })
      .eq('id', documentId);

    await supabase.from('job_logs').insert({
      job_id: jobId,
      log_level: 'error',
      message: timeoutMessage,
      details: { attempts, questionsCompleted, solutionsCompleted }
    });
  }
}
