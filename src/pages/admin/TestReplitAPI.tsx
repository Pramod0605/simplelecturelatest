import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const REPLIT_API_URL = "https://mathpix-ocr-llm-service-utuberpraveen.replit.app";

export default function TestReplitAPI() {
  const [questionsFile, setQuestionsFile] = useState<File | null>(null);
  const [solutionsFile, setSolutionsFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploadResponse, setUploadResponse] = useState<any>(null);
  const [statusResponse, setStatusResponse] = useState<any>(null);
  const [finalResult, setFinalResult] = useState<any>(null);

  const handleQuestionsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      setQuestionsFile(file);
    }
  };

  const handleSolutionsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      setSolutionsFile(file);
    }
  };

  const handleUpload = async () => {
    if (!questionsFile || !solutionsFile) {
      toast.error("Please select both PDF files");
      return;
    }

    setIsUploading(true);
    setUploadResponse(null);
    setStatusResponse(null);
    setFinalResult(null);
    setJobId(null);

    try {
      const formData = new FormData();
      formData.append("questions_file", questionsFile);
      formData.append("solutions_file", solutionsFile);

      console.log("Uploading to Replit API:", REPLIT_API_URL);
      
      const response = await fetch(`${REPLIT_API_URL}/process-educational-content`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Upload response:", data);
      
      setUploadResponse(data);
      
      if (data.job_id) {
        setJobId(data.job_id);
        toast.success("Files uploaded successfully!", {
          description: `Job ID: ${data.job_id}`,
        });
      } else {
        toast.warning("Upload completed but no job_id received");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Upload failed", {
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!jobId) {
      toast.error("No job ID available");
      return;
    }

    setIsChecking(true);

    try {
      console.log("Checking status for job:", jobId);
      
      const response = await fetch(`${REPLIT_API_URL}/status/${jobId}`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status check failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Status response:", data);
      
      setStatusResponse(data);

      if (data.status === "COMPLETED") {
        toast.success("Processing completed!");
        
        // Fetch the final result
        const resultResponse = await fetch(`${REPLIT_API_URL}/api/educational-result/${jobId}`, {
          method: "GET",
        });

        if (resultResponse.ok) {
          const resultData = await resultResponse.json();
          console.log("Final result:", resultData);
          setFinalResult(resultData);
        }
      } else if (data.status === "PROCESSING") {
        toast.info("Still processing...", {
          description: data.message || "Job is being processed",
        });
      } else if (data.status === "FAILED") {
        toast.error("Processing failed", {
          description: data.message || "Check logs for details",
        });
      }
    } catch (error: any) {
      console.error("Status check error:", error);
      toast.error("Status check failed", {
        description: error.message,
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test Replit API</h1>
        <p className="text-muted-foreground mt-2">
          Direct test interface for the Replit document processing API
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload PDFs</CardTitle>
          <CardDescription>
            Upload questions and solutions PDFs directly to the Replit API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="questions-file">Questions PDF</Label>
            <Input
              id="questions-file"
              type="file"
              accept=".pdf"
              onChange={handleQuestionsFileChange}
              disabled={isUploading}
            />
            {questionsFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {questionsFile.name} ({(questionsFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="solutions-file">Solutions PDF</Label>
            <Input
              id="solutions-file"
              type="file"
              accept=".pdf"
              onChange={handleSolutionsFileChange}
              disabled={isUploading}
            />
            {solutionsFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {solutionsFile.name} ({(solutionsFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={!questionsFile || !solutionsFile || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload to Replit
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Upload Response */}
      {uploadResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Upload Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
              {JSON.stringify(uploadResponse, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Status Check Section */}
      {jobId && (
        <Card>
          <CardHeader>
            <CardTitle>Check Processing Status</CardTitle>
            <CardDescription>Job ID: {jobId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="w-full"
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking Status...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Check Status
                </>
              )}
            </Button>

            {statusResponse && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Current Status: {statusResponse.status}</AlertTitle>
                <AlertDescription>
                  {statusResponse.message || "No message provided"}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Response */}
      {statusResponse && (
        <Card>
          <CardHeader>
            <CardTitle>Status Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
              {JSON.stringify(statusResponse, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Final Result */}
      {finalResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Final Result (Structured JSON)
            </CardTitle>
            <CardDescription>
              Parsed questions and solutions from the PDFs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
              {JSON.stringify(finalResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <code className="bg-muted px-2 py-1 rounded text-xs">
              POST {REPLIT_API_URL}/process-educational-content
            </code>
            <p className="text-muted-foreground mt-1">Upload PDFs and start processing</p>
          </div>
          <div>
            <code className="bg-muted px-2 py-1 rounded text-xs">
              GET {REPLIT_API_URL}/status/&#123;job_id&#125;
            </code>
            <p className="text-muted-foreground mt-1">Check processing status</p>
          </div>
          <div>
            <code className="bg-muted px-2 py-1 rounded text-xs">
              GET {REPLIT_API_URL}/api/educational-result/&#123;job_id&#125;
            </code>
            <p className="text-muted-foreground mt-1">Get final structured result</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
