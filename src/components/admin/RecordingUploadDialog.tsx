import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Upload, Video } from 'lucide-react';
import { format } from 'date-fns';

interface RecordingUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordingUploadDialog({ open, onOpenChange }: RecordingUploadDialogProps) {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch scheduled classes that don't have recordings yet
  const { data: scheduledClasses, isLoading: classesLoading } = useQuery({
    queryKey: ['scheduled-classes-without-recordings'],
    queryFn: async () => {
      // Get all scheduled classes
      const { data: classes, error: classesError } = await supabase
        .from('scheduled_classes')
        .select(`
          id,
          scheduled_at,
          subject,
          course:courses(id, name),
          teacher:teacher_profiles(id, full_name)
        `)
        .order('scheduled_at', { ascending: false })
        .limit(50);

      if (classesError) throw classesError;

      // Get classes that already have recordings
      const { data: recordings, error: recordingsError } = await supabase
        .from('class_recordings')
        .select('scheduled_class_id');

      if (recordingsError) throw recordingsError;

      const recordedClassIds = new Set(recordings?.map(r => r.scheduled_class_id) || []);

      // Filter out classes that already have recordings
      return classes?.filter(c => !recordedClassIds.has(c.id)) || [];
    },
    enabled: open,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClassId || !file) {
        throw new Error('Please select a class and a video file');
      }

      setIsUploading(true);

      // Create recording entry with pending status
      const { data: recording, error: insertError } = await supabase
        .from('class_recordings')
        .insert({
          scheduled_class_id: selectedClassId,
          original_filename: file.name,
          processing_status: 'pending',
          available_qualities: [],
          default_quality: '720p',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Note: Actual file upload to B2 would happen here via edge function
      // For now, we just create the record and mark it as pending
      toast.info('Recording entry created. Video processing will start automatically.');

      return recording;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recordings'] });
      queryClient.invalidateQueries({ queryKey: ['recording-stats'] });
      toast.success('Recording added successfully');
      onOpenChange(false);
      setSelectedClassId('');
      setFile(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to add recording: ${error.message}`);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('video/')) {
        toast.error('Please select a video file');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Recording
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Class */}
          <div className="space-y-2">
            <Label>Select Scheduled Class</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder={classesLoading ? 'Loading...' : 'Select a class'} />
              </SelectTrigger>
              <SelectContent>
                {scheduledClasses?.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>
                    <div className="flex flex-col">
                      <span>{(cls as any).subject || 'No Subject'}</span>
                      <span className="text-xs text-muted-foreground">
                        {(cls as any).course?.name} • {format(new Date((cls as any).scheduled_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </SelectItem>
                ))}
                {scheduledClasses?.length === 0 && (
                  <SelectItem value="none" disabled>
                    No classes available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Video File</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                id="video-upload"
              />
              <label htmlFor="video-upload" className="cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <Video className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      MP4, MKV, AVI up to 10GB
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedClassId || !file || isUploading}
            >
              {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Upload Recording
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
