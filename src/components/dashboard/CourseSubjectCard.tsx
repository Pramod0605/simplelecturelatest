import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Bot, BookOpen, ClipboardList } from 'lucide-react';
import type { SubjectWithDetails } from '@/hooks/useDashboardCourseDetails';

interface CourseSubjectCardProps {
  subject: SubjectWithDetails;
  courseId: string;
}

export const CourseSubjectCard = ({ subject, courseId }: CourseSubjectCardProps) => {
  const navigate = useNavigate();
  
  const progressPercent = subject.chaptersTotal > 0 
    ? Math.round((subject.chaptersCompleted / subject.chaptersTotal) * 100) 
    : 0;

  const handleAskAI = () => {
    navigate(`/learning/${courseId}?subject=${subject.id}&tab=ai-assistant`);
  };

  const handleViewSubject = () => {
    navigate(`/learning/${courseId}?subject=${subject.id}`);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 bg-card">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              {subject.thumbnail_url ? (
                <img 
                  src={subject.thumbnail_url} 
                  alt={subject.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <BookOpen className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {subject.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {subject.chaptersTotal} chapters
              </p>
            </div>
          </div>
          
          {subject.pendingAssignments > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <ClipboardList className="h-3 w-3" />
              {subject.pendingAssignments}
            </Badge>
          )}
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {subject.chaptersCompleted} of {subject.chaptersTotal} chapters completed
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleViewSubject}
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Study
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-gradient-to-r from-primary to-primary/80"
            onClick={handleAskAI}
          >
            <Bot className="h-4 w-4 mr-1" />
            Ask AI Teacher
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
