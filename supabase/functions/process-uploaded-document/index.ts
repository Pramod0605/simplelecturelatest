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

    console.log('Processing document:', documentId);

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

    await updateJobProgress(job.id, 10, 'Fetching document from storage');

    // Get document details including file_url
    const { data: doc } = await supabaseAdmin
      .from('uploaded_question_documents')
      .select('file_name, file_type, file_url')
      .eq('id', documentId)
      .single();

    if (!doc) {
      throw new Error('Document not found');
    }

    await logJobProgress(job.id, 'info', 'Document fetched', { file_name: doc.file_name });

    // Extract storage path from file_url
    // Format: https://PROJECT.supabase.co/storage/v1/object/public/bucket/path
    const urlParts = doc.file_url.split('/storage/v1/object/public/');
    if (urlParts.length < 2) {
      throw new Error('Invalid file URL format');
    }
    const fullPath = urlParts[1]; // e.g., "uploaded-question-documents/user-id/timestamp.pdf"
    const storagePath = fullPath.split('/').slice(1).join('/'); // Remove bucket name

    await logJobProgress(job.id, 'info', 'Extracted storage path', { storage_path: storagePath });

    // Detect file type
    const fileExtension = doc.file_name.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '');
    const isPDF = fileExtension === 'pdf';

    await logJobProgress(job.id, 'info', 'File type detected', { 
      extension: fileExtension, 
      isImage, 
      isPDF 
    });

    // Download file from storage using service role
    await updateJobProgress(job.id, 20, 'Downloading file from storage');
    
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('uploaded-question-documents')
      .download(storagePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file from storage: ${downloadError?.message || 'Unknown error'}`);
    }

    await logJobProgress(job.id, 'info', 'File downloaded successfully', { 
      size: fileData.size 
    });

    // Prepare file for multipart upload (no encoding needed)
    await updateJobProgress(job.id, 25, 'Preparing file for upload');

    const fileBuffer = await fileData.arrayBuffer();
    const blob = new Blob([fileBuffer], { type: doc.file_type });

    await logJobProgress(job.id, 'info', 'File prepared for upload', {
      size: fileData.size,
      type: doc.file_type
    });

    await updateJobProgress(job.id, 30, 'Uploading to Mathpix API');

    const mathpixAppId = Deno.env.get('MATHPIX_APP_ID');
    const mathpixAppKey = Deno.env.get('MATHPIX_APP_KEY');

    if (!mathpixAppId || !mathpixAppKey) {
      throw new Error('Mathpix API credentials not configured');
    }

    // For images: Use /v3/text endpoint (instant response)
    if (isImage) {
      await logJobProgress(job.id, 'info', 'Using /v3/text endpoint for image');
      await updateJobProgress(job.id, 35, 'Processing image with Mathpix');

      // Prepare multipart form data
      const formData = new FormData();
      formData.append('file', blob, doc.file_name);
      
      const options = {
        ocr_engine: "mathpix",
        formats: ["mmd", "md"],
        math_inline_delimiters: ["$", "$"],
        math_display_delimiters: ["$$", "$$"]
      };
      formData.append('options_json', JSON.stringify(options));

      const mathpixResponse = await fetch('https://api.mathpix.com/v3/text', {
        method: 'POST',
        headers: {
          'app_id': mathpixAppId,
          'app_key': mathpixAppKey,
          // DO NOT set Content-Type - FormData sets it automatically with boundary
        },
        body: formData,
      });

      if (!mathpixResponse.ok) {
        const errorText = await mathpixResponse.text();
        throw new Error(`Mathpix API error: ${mathpixResponse.status} - ${errorText}`);
      }

      const conversionData = await mathpixResponse.json();

      await logJobProgress(job.id, 'info', 'Image processed successfully');
      await updateJobProgress(job.id, 90, 'Storing results');

      // Store results immediately for images
      await supabaseAdmin
        .from('uploaded_question_documents')
        .update({
          mathpix_json_output: conversionData,
          mathpix_markdown: conversionData.markdown || conversionData.text,
          mathpix_mmd: conversionData.mmd,
          mathpix_latex: conversionData.latex_styled,
          mathpix_html: conversionData.html,
          status: 'completed',
          processing_completed_at: new Date().toISOString()
        })
        .eq('id', documentId);

      await updateJobProgress(job.id, 100, 'Processing complete', 'completed');
      await supabaseAdmin
        .from('document_processing_jobs')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', job.id);

      await logJobProgress(job.id, 'info', 'Job completed successfully');

      return new Response(
        JSON.stringify({ success: true, jobId: job.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For PDFs: Use /v3/pdf endpoint (async with background polling)
    if (isPDF) {
      await logJobProgress(job.id, 'info', 'Using /v3/pdf endpoint for PDF');
      await updateJobProgress(job.id, 35, 'Uploading PDF to Mathpix');

      // Prepare multipart form data
      const formData = new FormData();
      formData.append('file', blob, doc.file_name);
      
      const options = {
        ocr_engine: "mathpix",
        formats: ["mmd", "md"],
        math_inline_delimiters: ["$", "$"],
        math_display_delimiters: ["$$", "$$"]
      };
      formData.append('options_json', JSON.stringify(options));

      const mathpixResponse = await fetch('https://api.mathpix.com/v3/pdf', {
        method: 'POST',
        headers: {
          'app_id': mathpixAppId,
          'app_key': mathpixAppKey,
          // DO NOT set Content-Type - FormData sets it automatically with boundary
        },
        body: formData,
      });

      if (!mathpixResponse.ok) {
        const errorText = await mathpixResponse.text();
        throw new Error(`Mathpix API error: ${mathpixResponse.status} - ${errorText}`);
      }

      const mathpixData = await mathpixResponse.json();

      // Enhanced pdf_id extraction with fallbacks
      const pdfId = mathpixData.pdf_id || mathpixData.id || mathpixData.request_id;

      if (!pdfId) {
        await logJobProgress(job.id, 'error', 'Mathpix response missing PDF ID', {
          response_keys: Object.keys(mathpixData),
          full_response: mathpixData
        });
        throw new Error('Mathpix API returned success but no PDF ID found');
      }

      await logJobProgress(job.id, 'info', 'PDF upload successful', { pdf_id: pdfId });

      // Store pdf_id for polling
      await supabaseAdmin
        .from('document_processing_jobs')
        .update({ mathpix_pdf_id: pdfId })
        .eq('id', job.id);

      // Start background polling (fire and forget)
      pollMathpixCompletion(job.id, pdfId, documentId!, supabaseAdmin);

      await updateJobProgress(job.id, 40, `PDF submitted to Mathpix (ID: ${pdfId})`);

      // Return immediately - polling continues in background
      return new Response(
        JSON.stringify({ 
          success: true, 
          jobId: job.id,
          pdfId,
          message: 'PDF processing started in background'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Unsupported file type');

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

// Background polling function for PDF conversion
async function pollMathpixCompletion(
  jobId: string,
  pdfId: string,
  documentId: string,
  supabase: any
) {
  const mathpixAppId = Deno.env.get('MATHPIX_APP_ID');
  const mathpixAppKey = Deno.env.get('MATHPIX_APP_KEY');

  let attempts = 0;
  const maxAttempts = 60; // 10 minutes (10s intervals)

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

    try {
      const statusResponse = await fetch(`https://api.mathpix.com/v3/pdf/${pdfId}`, {
        headers: {
          'app_id': mathpixAppId!,
          'app_key': mathpixAppKey!,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.statusText}`);
      }

      const conversionData = await statusResponse.json();

      // Log progress
      await supabase
        .from('job_logs')
        .insert({
          job_id: jobId,
          log_level: 'info',
          message: `Polling Mathpix (attempt ${attempts + 1}/${maxAttempts})`,
          details: { status: conversionData.status, pdf_id: pdfId }
        });

      if (conversionData.status === 'completed') {
        await supabase.from('job_logs').insert({
          job_id: jobId,
          log_level: 'info',
          message: 'PDF conversion completed, downloading content',
          details: { 
            pdf_id: pdfId,
            has_mmd_url: !!conversionData.mmd_url,
            has_md_url: !!conversionData.url,
            has_direct_mmd: !!conversionData.mmd,
            has_direct_markdown: !!conversionData.markdown
          }
        });

        // Download the actual content from Mathpix URLs
        let markdownContent = null;
        let mmdContent = null;

        try {
          // First, check if content is directly in response (rare, but possible)
          if (conversionData.mmd) {
            mmdContent = conversionData.mmd;
            await supabase.from('job_logs').insert({
              job_id: jobId,
              log_level: 'info',
              message: 'MMD content found directly in response',
              details: { length: mmdContent.length }
            });
          } else if (conversionData.mmd_url) {
            // Download .mmd file from URL (Math Markdown - best for parsing questions)
            await supabase.from('job_logs').insert({
              job_id: jobId,
              log_level: 'info',
              message: 'Downloading MMD content from URL',
              details: { url: conversionData.mmd_url }
            });

            const mmdResponse = await fetch(conversionData.mmd_url, {
              headers: {
                'app_id': mathpixAppId!,
                'app_key': mathpixAppKey!,
              }
            });
            
            if (mmdResponse.ok) {
              const contentType = mmdResponse.headers.get('content-type');
              
              if (contentType?.includes('zip') || contentType?.includes('application/octet-stream')) {
                // It's a ZIP file - log for now
                await supabase.from('job_logs').insert({
                  job_id: jobId,
                  log_level: 'warn',
                  message: 'MMD content is in ZIP format (not yet supported)',
                  details: { 
                    url: conversionData.mmd_url,
                    contentType: contentType
                  }
                });
              } else {
                // Plain text content
                mmdContent = await mmdResponse.text();
                await supabase.from('job_logs').insert({
                  job_id: jobId,
                  log_level: 'info',
                  message: 'MMD content downloaded successfully',
                  details: { length: mmdContent.length }
                });
              }
            } else {
              await supabase.from('job_logs').insert({
                job_id: jobId,
                log_level: 'warn',
                message: 'Failed to download MMD content',
                details: { 
                  status: mmdResponse.status,
                  statusText: mmdResponse.statusText
                }
              });
            }
          }

          // Download plain Markdown as fallback
          if (conversionData.markdown) {
            markdownContent = conversionData.markdown;
          } else if (conversionData.url) {
            await supabase.from('job_logs').insert({
              job_id: jobId,
              log_level: 'info',
              message: 'Downloading Markdown content from URL',
              details: { url: conversionData.url }
            });

            const mdResponse = await fetch(conversionData.url, {
              headers: {
                'app_id': mathpixAppId!,
                'app_key': mathpixAppKey!,
              }
            });
            
            if (mdResponse.ok) {
              const contentType = mdResponse.headers.get('content-type');
              if (!contentType?.includes('zip')) {
                markdownContent = await mdResponse.text();
                await supabase.from('job_logs').insert({
                  job_id: jobId,
                  log_level: 'info',
                  message: 'Markdown content downloaded successfully',
                  details: { length: markdownContent.length }
                });
              }
            }
          }

          // Final validation
          if (!mmdContent && !markdownContent) {
            throw new Error('No content could be downloaded from Mathpix');
          }

          await supabase.from('job_logs').insert({
            job_id: jobId,
            log_level: 'info',
            message: 'Content download completed',
            details: { 
              has_mmd: !!mmdContent,
              has_markdown: !!markdownContent,
              mmd_length: mmdContent?.length || 0,
              markdown_length: markdownContent?.length || 0
            }
          });

        } catch (downloadError) {
          const errorMsg = downloadError instanceof Error ? downloadError.message : 'Unknown download error';
          await supabase.from('job_logs').insert({
            job_id: jobId,
            log_level: 'error',
            message: 'Failed to download content from Mathpix',
            details: { error: errorMsg }
          });
          
          console.error('Download error:', errorMsg);
        }

        // Store results with downloaded content
        await supabase
          .from('uploaded_question_documents')
          .update({
            mathpix_pdf_id: pdfId,
            mathpix_json_output: conversionData,
            mathpix_markdown: markdownContent,
            mathpix_mmd: mmdContent,
            mathpix_latex: conversionData.latex_styled,
            mathpix_html: conversionData.html,
            status: 'completed',
            processing_completed_at: new Date().toISOString()
          })
          .eq('id', documentId);

        await supabase
          .from('document_processing_jobs')
          .update({
            status: 'completed',
            progress_percentage: 100,
            current_step: 'Processing complete',
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId);

        await supabase.from('job_logs').insert({
          job_id: jobId,
          log_level: 'info',
          message: 'PDF conversion completed successfully',
          details: { 
            pdf_id: pdfId,
            has_mmd: !!mmdContent,
            has_markdown: !!markdownContent
          }
        });

        return;
      } else if (conversionData.status === 'error') {
        throw new Error(`Mathpix conversion failed: ${conversionData.error || 'Unknown error'}`);
      }

      // Update progress
      attempts++;
      await supabase
        .from('document_processing_jobs')
        .update({
          progress_percentage: 40 + Math.floor((attempts / maxAttempts) * 50),
          current_step: `Polling Mathpix (attempt ${attempts}/${maxAttempts})`
        })
        .eq('id', jobId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log error but continue polling
      await supabase
        .from('job_logs')
        .insert({
          job_id: jobId,
          log_level: 'error',
          message: `Polling error on attempt ${attempts + 1}`,
          details: { error: errorMessage }
        });
      
      attempts++;

      // If it's a fatal error, stop polling
      if (errorMessage.includes('conversion failed') || errorMessage.includes('Status check failed')) {
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

  // Timeout after max attempts
  const timeoutMessage = 'Mathpix conversion timeout after 10 minutes';
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
    details: { attempts: maxAttempts, pdf_id: pdfId }
  });
}
