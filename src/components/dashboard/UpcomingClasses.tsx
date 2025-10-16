import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video } from "lucide-react";
import { mockUpcomingClasses } from "@/data/mockInstructors";

const UpcomingClasses = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Upcoming Classes</h2>
      <div className="space-y-4">
        {mockUpcomingClasses.map((classItem) => (
          <div key={classItem.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">{classItem.subject}</h3>
                <p className="text-sm text-muted-foreground">{classItem.topic}</p>
              </div>
              <Badge variant="outline">{classItem.date}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {classItem.time}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {classItem.instructor}
              </div>
            </div>
            <Button size="sm" className="w-full">
              <Video className="h-4 w-4 mr-2" />
              Join Class
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default UpcomingClasses;
