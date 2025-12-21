import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToggleLiveStatus } from '@/hooks/useToggleLiveStatus';
import { useAddRecording } from '@/hooks/useAddRecording';
import { Radio, Video, VideoOff, Link as LinkIcon, Check } from 'lucide-react';

interface ScheduledClassForControls {
  id: string;
  is_live?: boolean;
  subject_name?: string;
  course_name?: string;
  scheduled_at?: string;
  recording_url?: string | null;
}

interface InstructorLiveControlsProps {
  scheduledClass: ScheduledClassForControls;
  onStatusChange?: () => void;
}

export const InstructorLiveControls = ({ scheduledClass, onStatusChange }: InstructorLiveControlsProps) => {
  const toggleLive = useToggleLiveStatus();
  const addRecording = useAddRecording();
  const [recordingUrl, setRecordingUrl] = useState('');
  const [isRecordingDialogOpen, setIsRecordingDialogOpen] = useState(false);

  const handleToggleLive = () => {
    toggleLive.mutate(
      { scheduledClassId: scheduledClass.id, isLive: !scheduledClass.is_live },
      { onSuccess: onStatusChange }
    );
  };

  const handleAddRecording = () => {
    if (!recordingUrl.trim()) return;
    addRecording.mutate(
      { scheduledClassId: scheduledClass.id, recordingUrl: recordingUrl.trim() },
      { 
        onSuccess: () => {
          setRecordingUrl('');
          setIsRecordingDialogOpen(false);
          onStatusChange?.();
        }
      }
    );
  };

  const isLive = scheduledClass.is_live;
  const hasRecording = !!scheduledClass.recording_url;

  return (
    <Card className={`transition-all ${isLive ? 'border-red-500 border-2' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{scheduledClass.subject_name || 'Class'}</CardTitle>
          {isLive && (
            <Badge variant="destructive" className="animate-pulse flex items-center gap-1">
              <Radio className="h-3 w-3" />
              LIVE
            </Badge>
          )}
          {hasRecording && !isLive && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Video className="h-3 w-3" />
              Recording Added
            </Badge>
          )}
        </div>
        {scheduledClass.course_name && (
          <p className="text-sm text-muted-foreground">{scheduledClass.course_name}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Live Toggle Button */}
        <Button
          variant={isLive ? 'destructive' : 'default'}
          className="w-full"
          onClick={handleToggleLive}
          disabled={toggleLive.isPending}
        >
          {isLive ? (
            <>
              <VideoOff className="h-4 w-4 mr-2" />
              End Live Class
            </>
          ) : (
            <>
              <Radio className="h-4 w-4 mr-2" />
              Go Live
            </>
          )}
        </Button>

        {/* Add Recording Button (only show if not live) */}
        {!isLive && (
          <Dialog open={isRecordingDialogOpen} onOpenChange={setIsRecordingDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <LinkIcon className="h-4 w-4 mr-2" />
                {hasRecording ? 'Update Recording' : 'Add Recording'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Recording Link</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recording-url">Recording URL</Label>
                  <Input
                    id="recording-url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={recordingUrl}
                    onChange={(e) => setRecordingUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste a YouTube, Vimeo, or Google Drive link
                  </p>
                </div>
                {scheduledClass.recording_url && (
                  <div className="text-sm text-muted-foreground">
                    Current: <a href={scheduledClass.recording_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">View Recording</a>
                  </div>
                )}
                <Button
                  onClick={handleAddRecording}
                  disabled={!recordingUrl.trim() || addRecording.isPending}
                  className="w-full"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save Recording
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};
