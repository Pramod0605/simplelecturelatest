import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpcomingClassesFromTimetable } from "@/hooks/useUpcomingClassesFromTimetable";
import { format, isToday, isTomorrow } from "date-fns";

const UpcomingClasses = () => {
  const { data: classes = [], isLoading } = useUpcomingClassesFromTimetable();

  const formatClassDate = (date: string) => {
    const classDate = new Date(date);
    if (isToday(classDate)) return "Today";
    if (isTomorrow(classDate)) return "Tomorrow";
    return format(classDate, "MMM d");
  };

  const formatClassTime = (date: string, duration: number) => {
    const startTime = format(new Date(date), "h:mm a");
    return `${startTime} (${duration} min)`;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Upcoming Classes</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border rounded-lg">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48 mb-3" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Upcoming Classes</h2>
      <div className="space-y-4">
        {classes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No upcoming classes scheduled</p>
          </div>
        ) : (
          classes.slice(0, 5).map((classItem) => (
            <div key={classItem.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{classItem.subject || 'Class'}</h3>
                  <p className="text-sm text-muted-foreground">{classItem.notes || 'General Session'}</p>
                </div>
                <Badge variant="outline">{formatClassDate(classItem.scheduled_at)}</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatClassTime(classItem.scheduled_at, classItem.duration_minutes)}
                </div>
                {classItem.teacher?.full_name && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {classItem.teacher.full_name}
                  </div>
                )}
              </div>
              {classItem.meeting_link && (
                <Button size="sm" className="w-full" asChild>
                  <a href={classItem.meeting_link} target="_blank" rel="noopener noreferrer">
                    <Video className="h-4 w-4 mr-2" />
                    Join Class
                  </a>
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default UpcomingClasses;
