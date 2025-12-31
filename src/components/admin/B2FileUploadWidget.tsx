import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, FileText, ExternalLink, X } from "lucide-react";
import { useB2Upload } from "@/hooks/useB2Upload";
import { generateB2Path, B2PathParams } from "@/lib/b2PathGenerator";
import { Progress } from "@/components/ui/progress";

interface B2FileUploadWidgetProps {
  onFileUploaded: (url: string) => void;
  currentFileUrl?: string;
  acceptedTypes?: string;
  maxSizeMB?: number;
  label?: string;
  pathParams: Omit<B2PathParams, 'fileName'>;
  metadata: {
    entityType: 'chapter' | 'topic' | 'subtopic' | 'previous_year_paper';
    categoryId: string;
    subjectId: string;
    chapterId?: string;
    topicId?: string;
    subtopicId?: string;
  };
}

export function B2FileUploadWidget({
  onFileUploaded,
  currentFileUrl,
  acceptedTypes = "application/pdf",
  maxSizeMB = 50,
  label = "Upload File",
  pathParams,
  metadata
}: B2FileUploadWidgetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localFileUrl, setLocalFileUrl] = useState(currentFileUrl || "");
  const { uploadFile, uploading, progress } = useB2Upload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      alert(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Generate B2 path
    const filePath = generateB2Path({
      ...pathParams,
      fileName: file.name
    });

    console.log('Uploading to B2:', filePath);

    const result = await uploadFile(file, filePath, metadata);
    
    if (result) {
      setLocalFileUrl(result.filePath);
      onFileUploaded(result.filePath);
    }


    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setLocalFileUrl("");
    onFileUploaded("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileChange}
        className="hidden"
        id="b2-file-upload"
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading... {progress}%
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {label}
          </>
        )}
      </Button>

      {uploading && (
        <Progress value={progress} className="w-full" />
      )}

      {localFileUrl && !uploading && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm flex-1 truncate">File uploaded successfully</span>
          <B2UploadedFileActions filePath={localFileUrl} onRemove={handleRemove} />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Max file size: {maxSizeMB}MB. Accepted: {acceptedTypes.split(',').map(t => t.split('/')[1]).join(', ')}
      </p>
    </div>
  );
}

interface B2UploadedFileActionsProps {
  filePath: string;
  onRemove: () => void;
}

function B2UploadedFileActions({ filePath, onRemove }: B2UploadedFileActionsProps) {
  const handleView = () => {
    // Navigate to dedicated PDF viewer page (avoids Chrome blocking)
    const encodedPath = encodeURIComponent(filePath);
    window.open(`/admin/pdf-viewer?path=${encodedPath}`, "_blank");
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleView}
        className="gap-1"
      >
        <ExternalLink className="h-3 w-3" />
        View
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </>
  );
}
