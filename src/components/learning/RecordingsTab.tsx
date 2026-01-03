import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useClassRecordings, useVideoWatchProgress } from '@/hooks/useClassRecordings';
import { AdaptiveVideoPlayer } from '@/components/learning/AdaptiveVideoPlayer';
import { format, isThisWeek, isThisMonth } from 'date-fns';
import { 
  Video, 
  Play, 
  Calendar, 
  User, 
  Search, 
  BookOpen, 
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecordingWithProgress {
  id: string;
  duration_seconds: number | null;
  available_qualities: string[] | null;
  processing_status: string | null;
  created_at: string | null;
  scheduled_class?: {
    id: string;
    scheduled_at: string;
    subject: string;
    course?: { id?: string; name: string } | null;
    teacher?: { id?: string; full_name: string } | null;
  } | null;
}

export const RecordingsTab = ({ courseId }: { courseId?: string }) => {
  const { data: recordings, isLoading } = useClassRecordings(courseId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecording, setSelectedRecording] = useState<RecordingWithProgress | null>(null);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const allRecordings = (recordings || []) as unknown as RecordingWithProgress[];
  
  // Filter by time period
  const filteredByTime = allRecordings.filter(r => {
    if (filter === 'all') return true;
    const date = r.scheduled_class?.scheduled_at ? new Date(r.scheduled_class.scheduled_at) : null;
    if (!date) return true;
    if (filter === 'week') return isThisWeek(date);
    if (filter === 'month') return isThisMonth(date);
    return true;
  });

  // Filter by search
  const filteredRecordings = filteredByTime.filter(recording => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    const subjectName = recording.scheduled_class?.subject || '';
    const courseName = recording.scheduled_class?.course?.name || '';
    return (
      subjectName.toLowerCase().includes(search) ||
      courseName.toLowerCase().includes(search)
    );
  });

  // Group by subject
  const groupedBySubject = filteredRecordings.reduce((acc, recording) => {
    const subjectName = recording.scheduled_class?.subject || 'Other';
    if (!acc[subjectName]) acc[subjectName] = [];
    acc[subjectName].push(recording);
    return acc;
  }, {} as Record<string, RecordingWithProgress[]>);

  if (allRecordings.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Recordings Available</h3>
        <p className="text-muted-foreground">
          Class recordings will appear here once they are processed.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recordings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Grouped Recordings */}
      {Object.keys(groupedBySubject).length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Results</h3>
          <p className="text-muted-foreground">No recordings match your search.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedBySubject).map(([subjectName, subjectRecordings]) => (
            <div key={subjectName}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {subjectName}
                <Badge variant="secondary" className="ml-2">{subjectRecordings.length}</Badge>
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjectRecordings.map((recording) => (
                  <RecordingCard 
                    key={recording.id} 
                    recording={recording}
                    onWatch={() => navigate(`/watch/${recording.id}`)}
                    onQuickWatch={() => setSelectedRecording(recording)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player Dialog */}
      <Dialog open={!!selectedRecording} onOpenChange={(open) => !open && setSelectedRecording(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
          <DialogTitle>
            {selectedRecording?.scheduled_class?.subject || 'Recording'}
            </DialogTitle>
          </DialogHeader>
          {selectedRecording && (
            <div className="p-4 pt-2">
              <AdaptiveVideoPlayer
                recordingId={selectedRecording.id}
                title={selectedRecording.scheduled_class?.subject || 'Recording'}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Recording Card with Progress
const RecordingCard = ({ 
  recording,
  onWatch,
  onQuickWatch
}: { 
  recording: RecordingWithProgress;
  onWatch: () => void;
  onQuickWatch: () => void;
}) => {
  const { data: progress } = useVideoWatchProgress(recording.id);
  
  const subjectName = recording.scheduled_class?.subject || 'Class';
  const courseName = recording.scheduled_class?.course?.name || '';
  const teacherName = (recording.scheduled_class?.teacher as any)?.full_name || '';
  const scheduledAt = recording.scheduled_class?.scheduled_at;
  const isReady = recording.processing_status === 'ready';
  const isProcessing = recording.processing_status === 'processing';

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} min`;
  };

  const watchPercentage = progress?.progress_percent || 0;
  const isCompleted = progress?.completed || false;

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 border-0 shadow-md hover:shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/30 before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 before:bg-gradient-to-r before:from-blue-500 before:to-indigo-500">
      <CardContent className="p-5 pt-6">
        <div className="flex items-start gap-4">
          {/* Icon Container */}
          <div className="p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110 bg-blue-100 dark:bg-blue-900/50">
            <Video className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-base line-clamp-1">{subjectName}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{courseName}</p>
              </div>
              
              {/* Status Badge */}
              {isReady && (
                <Badge className="bg-green-500/90 text-white shrink-0">
                  <Play className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              )}
              {isProcessing && (
                <Badge className="bg-blue-500/90 text-white shrink-0">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Processing
                </Badge>
              )}
              {!isReady && !isProcessing && (
                <Badge variant="secondary" className="shrink-0">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
            
            {/* Metadata Pills */}
            <div className="flex flex-wrap gap-2 mb-3">
              {scheduledAt && (
                <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100/70 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(scheduledAt), "MMM d, yyyy")}
                </div>
              )}
              {teacherName && (
                <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                  <User className="h-3 w-3" />
                  {teacherName}
                </div>
              )}
              {recording.duration_seconds && (
                <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
                  <Clock className="h-3 w-3" />
                  {formatDuration(recording.duration_seconds)}
                </div>
              )}
            </div>

            {/* Watch Progress */}
            {watchPercentage > 0 && !isCompleted && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{Math.round(watchPercentage)}%</span>
                </div>
                <Progress value={watchPercentage} className="h-1.5" />
              </div>
            )}

            {/* Completed Badge */}
            {isCompleted && (
              <Badge className="bg-green-500 text-white mb-3">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Watched
              </Badge>
            )}

            {/* Quality Badges */}
            {recording.available_qualities && recording.available_qualities.length > 0 && (
              <div className="flex gap-1 mb-3 flex-wrap">
                {(recording.available_qualities as string[]).map(q => (
                  <Badge key={q} variant="outline" className="text-xs">{q}</Badge>
                ))}
              </div>
            )}

            {/* Action Button */}
            {isReady ? (
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={onWatch}>
                <Play className="h-4 w-4 mr-2" />
                {watchPercentage > 0 && !isCompleted ? 'Continue Watching' : 'Watch Recording'}
              </Button>
            ) : (
              <Button className="w-full" variant="outline" disabled>
                <Clock className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Coming Soon'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
