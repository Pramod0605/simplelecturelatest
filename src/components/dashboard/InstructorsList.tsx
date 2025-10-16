import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { mockInstructors } from "@/data/mockInstructors";
import { Mail, GraduationCap } from "lucide-react";

export const InstructorsList = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Instructors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {mockInstructors.map((instructor) => (
              <div
                key={instructor.id}
                className="flex flex-col gap-3 p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={instructor.avatar} />
                    <AvatarFallback>
                      {instructor.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base mb-1">{instructor.name}</h4>
                    <Badge variant="secondary" className="text-xs mb-2">
                      {instructor.subject}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground pl-1">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span className="text-xs">{instructor.qualification}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-xs">{instructor.experience} of teaching</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};