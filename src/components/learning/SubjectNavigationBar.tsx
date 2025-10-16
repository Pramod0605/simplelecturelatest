import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

interface SubjectNavigationBarProps {
  subjects: { name: string; slug: string }[];
}

export const SubjectNavigationBar = ({ subjects }: SubjectNavigationBarProps) => {
  const navigate = useNavigate();
  const { courseId, subjectId } = useParams();

  const handleSubjectChange = (subjectSlug: string) => {
    navigate(`/learning/${courseId}/${subjectSlug}`);
  };

  return (
    <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-2 px-6 py-3 overflow-x-auto">
        <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div className="flex gap-2">
          {subjects.map((subject) => (
            <Button
              key={subject.slug}
              variant={subjectId === subject.slug ? "default" : "ghost"}
              size="sm"
              onClick={() => handleSubjectChange(subject.slug)}
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
