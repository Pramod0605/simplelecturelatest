import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, MapPin, Video } from "lucide-react";
import { useScheduledClasses } from "@/hooks/useScheduledClasses";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export const UpcomingClasses = () => {
  const { classes, isLoading } = useScheduledClasses();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Upcoming Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Classes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {classes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No upcoming classes scheduled</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {classes.map((classItem) => (
                <div
                  key={classItem.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={classItem.teacher?.avatar_url || ''} />
                      <AvatarFallback>
                        {classItem.teacher?.full_name?.[0] || 'T'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h4 className="font-medium text-sm">{classItem.subject}</h4>
                          <p className="text-xs text-muted-foreground">
                            {classItem.teacher?.full_name || 'Teacher'}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {classItem.duration_minutes}m
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(classItem.scheduled_at), 'MMM dd, HH:mm')}
                        </div>
                        {classItem.room_number && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Room {classItem.room_number}
                          </div>
                        )}
                      </div>

                      {classItem.meeting_link && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 h-7 text-xs"
                          asChild
                        >
                          <a
                            href={classItem.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Video className="h-3 w-3 mr-1" />
                            Join Online
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
