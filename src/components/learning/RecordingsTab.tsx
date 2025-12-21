import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { usePastClasses } from '@/hooks/usePastClasses';
import { useBBBConfigured } from '@/hooks/useBBBSettings';
import { useBBBRecordings } from '@/hooks/useBBBMeeting';
import { format } from 'date-fns';
import { Video, Play, Calendar, User, Search, BookOpen, ExternalLink } from 'lucide-react';

interface BBBRecording {
  recordID: string;
  meetingID: string;
  name: string;
  published: boolean;
  startTime: number;
  endTime: number;
  playbackUrl: string;
  size: number;
}

export const RecordingsTab = () => {
  const { data: pastClasses, isLoading } = usePastClasses({ withRecordingsOnly: false });
  const { isConfigured: isBBBConfigured } = useBBBConfigured();
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const allClasses = pastClasses || [];
  
  // Filter classes that have either manual recordings or BBB meetings
  const recordingsData = allClasses.filter(c => 
    c.recording_url || (isBBBConfigured && c.bbb_meeting_id)
  );

  const filteredRecordings = recordingsData.filter(recording => {
    const search = searchQuery.toLowerCase();
    const subjectName = (recording.subject as { name?: string } | null)?.name || '';
    const courseName = (recording.course as { name?: string } | null)?.name || '';
    return (
      subjectName.toLowerCase().includes(search) ||
      courseName.toLowerCase().includes(search)
    );
  });

  if (recordingsData.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Recordings Available</h3>
        <p className="text-muted-foreground">
          Class recordings will appear here once your instructors add them.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search recordings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Recordings List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecordings.map((recording) => (
          <RecordingCard 
            key={recording.id} 
            recording={recording} 
            isBBBConfigured={isBBBConfigured} 
          />
        ))}
      </div>

      {filteredRecordings.length === 0 && searchQuery && (
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Results</h3>
          <p className="text-muted-foreground">No recordings match your search query.</p>
        </Card>
      )}
    </div>
  );
};

// Separate component to handle BBB recordings per class
const RecordingCard = ({ 
  recording, 
  isBBBConfigured 
}: { 
  recording: any; 
  isBBBConfigured: boolean;
}) => {
  const { data: bbbRecordings, isLoading: bbbLoading } = useBBBRecordings(
    isBBBConfigured && recording.bbb_meeting_id ? recording.id : undefined
  );

  const subjectName = (recording.subject as { name?: string } | null)?.name || 'Class';
  const courseName = (recording.course as { name?: string } | null)?.name || '';
  const teacherName = (recording.teacher as { full_name?: string } | null)?.full_name || '';

  const hasBBBRecordings = bbbRecordings && bbbRecordings.length > 0;
  const hasManualRecording = !!recording.recording_url;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
        <Video className="h-12 w-12 text-primary/50" />
        <div className="absolute top-2 right-2 flex gap-1">
          {hasBBBRecordings && (
            <Badge variant="secondary">
              <Play className="h-3 w-3 mr-1" />
              BBB
            </Badge>
          )}
          {hasManualRecording && (
            <Badge variant="outline">
              <ExternalLink className="h-3 w-3 mr-1" />
              Manual
            </Badge>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-1">{subjectName}</h3>
        <p className="text-sm text-muted-foreground mb-3">{courseName}</p>
        
        <div className="space-y-1 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(recording.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
          </div>
          {teacherName && (
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              {teacherName}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {/* BBB Recordings */}
          {bbbLoading && isBBBConfigured && recording.bbb_meeting_id && (
            <Skeleton className="h-9 w-full" />
          )}
          
          {hasBBBRecordings && bbbRecordings.map((bbbRec: BBBRecording, idx: number) => (
            <Button 
              key={bbbRec.recordID || idx} 
              className="w-full" 
              variant="default"
              asChild
            >
              <a href={bbbRec.playbackUrl} target="_blank" rel="noopener noreferrer">
                <Play className="h-4 w-4 mr-2" />
                Watch BBB Recording {bbbRecordings.length > 1 ? `#${idx + 1}` : ''}
              </a>
            </Button>
          ))}

          {/* Manual Recording */}
          {hasManualRecording && (
            <Button 
              className="w-full" 
              variant={hasBBBRecordings ? "outline" : "default"}
              asChild
            >
              <a href={recording.recording_url} target="_blank" rel="noopener noreferrer">
                <Play className="h-4 w-4 mr-2" />
                Watch Recording
              </a>
            </Button>
          )}

          {/* No recordings at all */}
          {!hasManualRecording && !hasBBBRecordings && !bbbLoading && (
            <Button className="w-full" variant="outline" disabled>
              <Video className="h-4 w-4 mr-2" />
              Recording Pending
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
