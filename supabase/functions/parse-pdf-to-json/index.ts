import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DatalabResponse {
  request_id: string;
  status: string;
  markdown?: string;
  json?: any;
  images?: Record<string, string>;
  page_count?: number;
  metadata?: {
    pages?: number;
    ocr_stats?: any;
  };
}

// Helper function to get B2 signed download URL
async function getB2DownloadUrl(filePath: string): Promise<string> {
  const B2_KEY_ID = Deno.env.get("B2_KEY_ID");
  const B2_APP_KEY = Deno.env.get("B2_APPLICATION_KEY");
  const B2_BUCKET_NAME = Deno.env.get("B2_BUCKET_NAME") || "Simplelecture";
  
  console.log("B2 credentials check - KEY_ID exists:", !!B2_KEY_ID, "APP_KEY exists:", !!B2_APP_KEY);
  
  if (!B2_KEY_ID || !B2_APP_KEY) {
    throw new Error("B2 credentials not configured");
  }
  
  const authResponse = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
    method: "GET",
    headers: {
      Authorization: "Basic " + btoa(`${B2_KEY_ID}:${B2_APP_KEY}`),
    },
  });
  
  if (!authResponse.ok) {
    throw new Error("Failed to authorize with B2");
  }
  
  const authData = await authResponse.json();
  const { authorizationToken, apiUrl, downloadUrl } = authData;
  
  const downloadAuthResponse = await fetch(`${apiUrl}/b2api/v2/b2_get_download_authorization`, {
    method: "POST",
    headers: {
      Authorization: authorizationToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bucketId: Deno.env.get("B2_BUCKET_ID"),
      fileNamePrefix: filePath,
      validDurationInSeconds: 3600,
    }),
  });
  
  if (!downloadAuthResponse.ok) {
    throw new Error("Failed to get B2 download authorization");
  }
  
  const downloadAuthData = await downloadAuthResponse.json();
  const signedUrl = `${downloadUrl}/file/${B2_BUCKET_NAME}/${filePath}?Authorization=${downloadAuthData.authorizationToken}`;
  
  return signedUrl;
}

// Upload base64 image to Supabase Storage
async function uploadImageToStorage(
  supabase: any,
  base64Data: string,
  imageName: string,
  requestId: string
): Promise<string | null> {
  try {
    // Remove data URL prefix if present
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Detect image type from base64 or default to png
    let contentType = 'image/png';
    let extension = 'png';
    
    if (base64Data.includes('data:image/jpeg') || base64Data.includes('data:image/jpg')) {
      contentType = 'image/jpeg';
      extension = 'jpg';
    } else if (base64Data.includes('data:image/webp')) {
      contentType = 'image/webp';
      extension = 'webp';
    }
    
    // Decode base64 to binary
    const binaryStr = atob(base64Clean);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    
    // Generate storage path
    const storagePath = `${requestId}/${imageName}.${extension}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('pdf-images')
      .upload(storagePath, bytes, {
        contentType,
        upsert: true,
      });
    
    if (error) {
      console.error(`Failed to upload image ${imageName}:`, error);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('pdf-images')
      .getPublicUrl(storagePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error(`Error uploading image ${imageName}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DATALAB_API_KEY = Deno.env.get("DATALAB_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!DATALAB_API_KEY) {
      throw new Error("DATALAB_API_KEY is not configured");
    }
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }
    
    // Create Supabase client for storage uploads
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    let pdfUrl = formData.get("pdf_url") as string | null;

    if (!file && !pdfUrl) {
      return new Response(
        JSON.stringify({ error: "Either file or pdf_url is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting PDF parsing with Datalab Marker API...");
    console.log("File:", file?.name, "Size:", file?.size);
    console.log("PDF URL (raw):", pdfUrl);

    // If pdfUrl is a relative B2 path (not starting with http), get signed URL
    if (pdfUrl && !pdfUrl.startsWith("http")) {
      console.log("Converting B2 path to signed URL...");
      pdfUrl = await getB2DownloadUrl(pdfUrl);
      console.log("Signed URL obtained");
    }

    // Prepare the request to Datalab Marker API
    const datalabFormData = new FormData();
    
    if (file) {
      datalabFormData.append("file", file, file.name);
    } else if (pdfUrl) {
      datalabFormData.append("file_url", pdfUrl);
    }

    // Configure output options - USE MARKDOWN for cleaner text extraction
    datalabFormData.append("output_format", "markdown");
    datalabFormData.append("force_ocr", "true");
    datalabFormData.append("paginate_output", "false");
    datalabFormData.append("skip_cache", "true");

    // Submit to Datalab Marker API
    console.log("Submitting to Datalab Marker API with markdown output...");
    const submitResponse = await fetch("https://www.datalab.to/api/v1/marker", {
      method: "POST",
      headers: {
        "X-API-Key": DATALAB_API_KEY,
      },
      body: datalabFormData,
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error("Datalab submit error:", submitResponse.status, errorText);
      throw new Error(`Datalab API error: ${submitResponse.status} - ${errorText}`);
    }

    const submitResult = await submitResponse.json();
    const requestId = submitResult.request_id;
    console.log("Datalab request submitted, ID:", requestId);

    if (!requestId) {
      throw new Error("No request_id received from Datalab");
    }

    // Poll for completion (max 5 minutes, 3-second intervals)
    const maxAttempts = 100;
    let attempts = 0;
    let result: DatalabResponse | null = null;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      attempts++;

      console.log(`Polling attempt ${attempts}/${maxAttempts}...`);

      const statusResponse = await fetch(`https://www.datalab.to/api/v1/marker/${requestId}`, {
        method: "GET",
        headers: {
          "X-API-Key": DATALAB_API_KEY,
        },
      });

      if (!statusResponse.ok) {
        console.error("Status check failed:", statusResponse.status);
        continue;
      }

      const statusResult: DatalabResponse = await statusResponse.json();
      console.log("Status:", statusResult.status);

      if (statusResult.status === "complete") {
        result = statusResult;
        break;
      } else if (statusResult.status === "failed") {
        throw new Error("Datalab processing failed");
      }
    }

    if (!result) {
      throw new Error("Datalab processing timed out after 5 minutes");
    }

    const pageCount = result.page_count ?? result.metadata?.pages ?? 0;

    console.log("Datalab processing complete!");
    console.log("Page count:", pageCount);
    console.log("Has JSON:", !!result.json);
    console.log("Has Markdown:", !!result.markdown);
    console.log("Markdown length:", result.markdown?.length || 0);
    console.log("Images count:", result.images ? Object.keys(result.images).length : 0);
    
    // Log sample of markdown for debugging
    if (result.markdown && result.markdown.length > 0) {
      console.log("Markdown sample (first 500 chars):", result.markdown.substring(0, 500));
    }

    // Upload images to Supabase Storage and get public URLs
    const imageUrls: Record<string, string> = {};
    const uploadedImages: { url: string; pageNumber: number; name: string }[] = [];
    
    if (result.images && Object.keys(result.images).length > 0) {
      console.log("Uploading extracted images to Supabase Storage...");
      
      const imageEntries = Object.entries(result.images);
      for (let i = 0; i < imageEntries.length; i++) {
        const [imageName, base64Data] = imageEntries[i];
        
        console.log(`Uploading image ${i + 1}/${imageEntries.length}: ${imageName}`);
        
        const publicUrl = await uploadImageToStorage(
          supabase,
          base64Data,
          imageName,
          requestId
        );
        
        if (publicUrl) {
          imageUrls[imageName] = publicUrl;
          uploadedImages.push({
            url: publicUrl,
            pageNumber: i + 1,
            name: imageName,
          });
        }
      }
      
      console.log(`Uploaded ${uploadedImages.length} images successfully`);
    }

    // Return parsed content with image URLs instead of base64
    return new Response(
      JSON.stringify({
        success: true,
        request_id: requestId,
        content_json: result.json || null,
        content_markdown: result.markdown || null,
        // Return URLs instead of base64 data
        images: imageUrls,
        // Also return as array for easier consumption
        uploaded_images: uploadedImages,
        metadata: {
          pages: pageCount,
          ocr_stats: result.metadata?.ocr_stats || null,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error parsing PDF:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to parse PDF", 
        details: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
