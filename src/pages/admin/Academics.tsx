import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BookOpen, FileText, ClipboardList } from "lucide-react";

export default function Academics() {
  const sections = [
    {
      title: "Class Schedule",
      icon: Calendar,
      description: "Manage class timetables and schedules",
    },
    {
      title: "Curriculum",
      icon: BookOpen,
      description: "Organize course curriculum and syllabus",
    },
    {
      title: "Assignments",
      icon: FileText,
      description: "Create and manage student assignments",
    },
    {
      title: "Assessments",
      icon: ClipboardList,
      description: "Set up tests and evaluations",
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Academics</h1>
        <p className="text-muted-foreground">Academic management tools and resources</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{section.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
