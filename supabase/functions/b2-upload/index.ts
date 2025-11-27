import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's a 503 error that we should retry
      if (errorMessage.includes('503') || errorMessage.includes('service_unavailable') || errorMessage.includes('no tomes available')) {
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`Attempt ${attempt + 1} failed with 503, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } else {
        // If it's not a transient error, don't retry
        throw error;
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

interface UploadRequest {
  file: {
    name: string;
    type: string;
    base64: string;
  };
  filePath: string;
  metadata: {
    entityType: string;
    categoryId: string;
    subjectId: string;
    chapterId?: string;
    topicId?: string;
    subtopicId?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const requestData: UploadRequest = await req.json();
    const { file, filePath, metadata } = requestData;

    console.log('Upload request - Raw filePath:', filePath);
    console.log('Upload metadata:', metadata);

    // Get B2 credentials
    const B2_KEY_ID = Deno.env.get('B2_KEY_ID');
    const B2_APPLICATION_KEY = Deno.env.get('B2_APPLICATION_KEY');
    const B2_BUCKET_ID = Deno.env.get('B2_BUCKET_ID');

    if (!B2_KEY_ID || !B2_APPLICATION_KEY || !B2_BUCKET_ID) {
      throw new Error('B2 credentials not configured');
    }

    // Step 1: Authorize with B2
    const authResponse = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${B2_KEY_ID}:${B2_APPLICATION_KEY}`)
      }
    });

    if (!authResponse.ok) {
      throw new Error(`B2 authorization failed: ${await authResponse.text()}`);
    }

    const authData = await authResponse.json();
    console.log('B2 authorized successfully');

    // Step 2: Get upload URL with retry logic
    const uploadUrlData = await retryWithBackoff(async () => {
      const uploadUrlResponse = await fetch(`${authData.apiUrl}/b2api/v2/b2_get_upload_url`, {
        method: 'POST',
        headers: {
          'Authorization': authData.authorizationToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bucketId: B2_BUCKET_ID })
      });

      if (!uploadUrlResponse.ok) {
        const errorText = await uploadUrlResponse.text();
        throw new Error(`Failed to get upload URL (${uploadUrlResponse.status}): ${errorText}`);
      }

      return await uploadUrlResponse.json();
    });

    console.log('Got upload URL');

    // Step 3: Convert base64 to bytes
    const fileBytes = Uint8Array.from(atob(file.base64), c => c.charCodeAt(0));
    
    // Calculate SHA1 hash
    const hashBuffer = await crypto.subtle.digest('SHA-1', fileBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha1Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Using raw filePath for B2 storage:', filePath);

    // Step 4: Upload file to B2 with retry logic
    // IMPORTANT: Use raw filePath - B2 handles encoding internally
    const uploadResult = await retryWithBackoff(async () => {
      const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': uploadUrlData.authorizationToken,
          'X-Bz-File-Name': filePath, // Raw path - B2 handles encoding
          'Content-Type': file.type,
          'Content-Length': fileBytes.length.toString(),
          'X-Bz-Content-Sha1': sha1Hash
        },
        body: fileBytes
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed (${uploadResponse.status}): ${errorText}`);
      }

      return await uploadResponse.json();
    });
    console.log('File uploaded successfully:', uploadResult.fileId);

    // Step 5: Save metadata to database
    const { data: storageFile, error: dbError } = await supabase
      .from('storage_files')
      .insert({
        file_name: file.name,
        file_path: filePath,
        file_size: fileBytes.length,
        file_type: file.type,
        b2_file_id: uploadResult.fileId,
        entity_type: metadata.entityType,
        category_id: metadata.categoryId,
        subject_id: metadata.subjectId,
        chapter_id: metadata.chapterId || null,
        topic_id: metadata.topicId || null,
        subtopic_id: metadata.subtopicId || null,
        uploaded_by: user.id
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to save file metadata: ${dbError.message}`);
    }

    // Return file path (for private buckets, authorized URLs will be generated on demand)
    return new Response(
      JSON.stringify({
        success: true,
        fileId: uploadResult.fileId,
        filePath,
        storageFile
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in b2-upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
