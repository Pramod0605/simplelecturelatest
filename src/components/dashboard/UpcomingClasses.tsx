import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, Video } from "lucide-react";
import { mockUpcomingClasses } from "@/data/mockInstructors";
import { Button } from "@/components/ui/button";

export const UpcomingClasses = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Classes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {mockUpcomingClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{classItem.subject}</h4>
                    <p className="text-xs text-muted-foreground">{classItem.topic}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {classItem.duration}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {classItem.time}
                  </div>
                  <p className="text-xs font-medium">{classItem.instructor}</p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 h-7 text-xs w-full"
                  asChild
                >
                  <a
                    href={classItem.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Video className="h-3 w-3 mr-1" />
                    Join Live Class
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
