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
  metadata?: {
    pages: number;
    ocr_stats?: any;
  };
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
    const pdfUrl = formData.get("pdf_url") as string | null;

    if (!file && !pdfUrl) {
      return new Response(
        JSON.stringify({ error: "Either file or pdf_url is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting PDF parsing with Datalab Marker API...");
    console.log("File:", file?.name, "Size:", file?.size);
    console.log("PDF URL:", pdfUrl);

    // Prepare the request to Datalab Marker API
    const datalabFormData = new FormData();
    
    if (file) {
      datalabFormData.append("file", file, file.name);
    } else if (pdfUrl) {
      datalabFormData.append("url", pdfUrl);
    }

    // Configure output options
    datalabFormData.append("output_format", "json");
    datalabFormData.append("use_llm", "true"); // Use LLM for better accuracy
    datalabFormData.append("force_ocr", "false");
    datalabFormData.append("paginate_output", "false");

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

    console.log("Datalab processing complete!");
    console.log("Pages:", result.metadata?.pages);
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
          pages: result.metadata?.pages || 0,
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
