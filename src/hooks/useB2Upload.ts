import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UploadMetadata {
  entityType: 'chapter' | 'topic' | 'subtopic' | 'previous_year_paper';
  categoryId: string;
  subjectId: string;
  chapterId?: string;
  topicId?: string;
  subtopicId?: string;
}

interface UploadResult {
  success: boolean;
  fileId: string;
  filePath: string;
  storageFile?: any;
}


export function useB2Upload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (
    file: File,
    filePath: string,
    metadata: UploadMetadata
  ): Promise<UploadResult | null> => {
    setUploading(true);
    setProgress(0);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove data URL prefix
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setProgress(30);

      // Upload to B2 via edge function
      const { data, error } = await supabase.functions.invoke('b2-upload', {
        body: {
          file: {
            name: file.name,
            type: file.type,
            base64
          },
          filePath,
          metadata
        }
      });

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Upload failed');
      }

      setProgress(100);

      toast({
        title: "Upload successful",
        description: `File uploaded to ${filePath}`,
      });

      return data as UploadResult;

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return {
    uploadFile,
    uploading,
    progress
  };
}
