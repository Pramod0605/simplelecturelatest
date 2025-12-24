import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  // Datalab returns page_count at the top level, not in metadata
  page_count?: number;
  metadata?: {
    pages?: number; // legacy/fallback
    ocr_stats?: any;
  };
}

// Helper function to get B2 signed download URL
async function getB2DownloadUrl(filePath: string): Promise<string> {
  const B2_KEY_ID = Deno.env.get("B2_KEY_ID");
  const B2_APP_KEY = Deno.env.get("B2_APPLICATION_KEY"); // Correct secret name
  const B2_BUCKET_NAME = Deno.env.get("B2_BUCKET_NAME") || "Simplelecture";
  
  console.log("B2 credentials check - KEY_ID exists:", !!B2_KEY_ID, "APP_KEY exists:", !!B2_APP_KEY);
  
  if (!B2_KEY_ID || !B2_APP_KEY) {
    throw new Error("B2 credentials not configured");
  }
  
  // Authorize with B2
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
  
  // Get download authorization
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DATALAB_API_KEY = Deno.env.get("DATALAB_API_KEY");
    if (!DATALAB_API_KEY) {
      throw new Error("DATALAB_API_KEY is not configured");
    }

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

    // Configure output options per Datalab docs
    datalabFormData.append("output_format", "json");
    datalabFormData.append("use_llm", "true");
    datalabFormData.append("force_ocr", "false");
    datalabFormData.append("paginate", "false"); // Correct param name per docs

    // Submit to Datalab Marker API
    console.log("Submitting to Datalab Marker API...");
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
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
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
      // Continue polling for 'pending' or 'processing' status
    }

    if (!result) {
      throw new Error("Datalab processing timed out after 5 minutes");
    }

    // Use page_count from top-level (per Datalab docs), fallback to metadata.pages
    const pageCount = result.page_count ?? result.metadata?.pages ?? 0;

    console.log("Datalab processing complete!");
    console.log("Page count:", pageCount);
    console.log("Has JSON:", !!result.json);
    console.log("Has Markdown:", !!result.markdown);
    console.log("Images count:", result.images ? Object.keys(result.images).length : 0);

    // Return the parsed content
    return new Response(
      JSON.stringify({
        success: true,
        request_id: requestId,
        content_json: result.json || null,
        content_markdown: result.markdown || null,
        images: result.images || {},
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
