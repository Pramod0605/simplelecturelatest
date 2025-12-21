import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { usePastClasses } from '@/hooks/usePastClasses';
import { format } from 'date-fns';
import { Video, Play, Calendar, User, Search, BookOpen } from 'lucide-react';

export const RecordingsTab = () => {
  const { data: pastClasses, isLoading } = usePastClasses({ withRecordingsOnly: true });
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

  const recordings = pastClasses || [];

  const filteredRecordings = recordings.filter(recording => {
    const search = searchQuery.toLowerCase();
    const subjectName = (recording.subject as { name?: string } | null)?.name || '';
    const courseName = (recording.course as { name?: string } | null)?.name || '';
    return (
      subjectName.toLowerCase().includes(search) ||
      courseName.toLowerCase().includes(search)
    );
  });

  if (recordings.length === 0) {
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
        {filteredRecordings.map((recording) => {
          const subjectName = (recording.subject as { name?: string } | null)?.name || 'Class';
          const courseName = (recording.course as { name?: string } | null)?.name || '';
          const teacherName = (recording.teacher as { full_name?: string } | null)?.full_name || '';

          return (
            <Card key={recording.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
                <Video className="h-12 w-12 text-primary/50" />
                <Badge className="absolute top-2 right-2" variant="secondary">
                  <Play className="h-3 w-3 mr-1" />
                  Recording
                </Badge>
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

                <Button className="w-full" asChild>
                  <a href={recording.recording_url || '#'} target="_blank" rel="noopener noreferrer">
                    <Play className="h-4 w-4 mr-2" />
                    Watch Recording
                  </a>
                </Button>
              </CardContent>
            </Card>
          );
        })}
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
