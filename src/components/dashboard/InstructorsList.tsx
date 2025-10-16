import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { mockInstructors } from "@/data/mockInstructors";
import { useRef } from "react";

const InstructorsList = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">My Instructors</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => scroll('left')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => scroll('right')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {mockInstructors.map((instructor) => (
          <Card 
            key={instructor.id} 
            className="flex-shrink-0 w-[300px] p-4 snap-start hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-3">
                <AvatarImage src={instructor.avatar} alt={instructor.name} />
                <AvatarFallback>{instructor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg mb-1">{instructor.name}</h3>
              <Badge variant="secondary" className="mb-2">{instructor.subject}</Badge>
              <div className="flex items-center gap-1 mb-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{instructor.rating}</span>
                <span className="text-xs text-muted-foreground">({instructor.studentsCount}+ students)</span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{instructor.qualification}</p>
              <p className="text-xs text-muted-foreground mb-3">{instructor.experience} experience</p>
              <Button size="sm" variant="outline" className="w-full">
                <MessageCircle className="h-3 w-3 mr-2" />
                Contact
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default InstructorsList;
