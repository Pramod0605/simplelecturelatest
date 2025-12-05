import { Button } from "@/components/ui/button";
import { BookOpen, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubjectNavigationBarProps {
  subjects: { name: string; slug: string; id: string }[];
  selectedSubjectId?: string | null;
  onSubjectChange?: (subjectId: string) => void;
  courseName?: string;
}

export const SubjectNavigationBar = ({ 
  subjects, 
  selectedSubjectId,
  onSubjectChange,
  courseName
}: SubjectNavigationBarProps) => {
  const navigate = useNavigate();

  return (
    <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-2 px-6 py-3 overflow-x-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/my-courses")}
          className="flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        
        <div className="h-6 w-px bg-border mx-2" />
        
        <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        
        {courseName && (
          <span className="font-semibold text-sm flex-shrink-0 mr-4">
            {courseName}
          </span>
        )}
        
        <div className="flex gap-2">
          {subjects.map((subject) => (
            <Button
              key={subject.id}
              variant={selectedSubjectId === subject.id ? "default" : "ghost"}
              size="sm"
              onClick={() => onSubjectChange?.(subject.id)}
              className="whitespace-nowrap"
            >
              {subject.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
