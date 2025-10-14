import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTeachers } from "@/hooks/useTeachers";
import { Mail, Phone, GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const InstructorsList = () => {
  const { teachers, isLoading } = useTeachers();

  // Mock data for when no teachers are loaded
  const mockInstructors = [
    {
      id: '1',
      full_name: 'Dr. Rajesh Kumar',
      email: 'rajesh@simplelecture.com',
      phone_number: '+91-9876543210',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh',
      specialization: ['Physics'],
      experience_years: 15,
    },
    {
      id: '2',
      full_name: 'Prof. Priya Sharma',
      email: 'priya@simplelecture.com',
      phone_number: '+91-9876543211',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
      specialization: ['Chemistry'],
      experience_years: 12,
    },
    {
      id: '3',
      full_name: 'Mr. Amit Singh',
      email: 'amit@simplelecture.com',
      phone_number: '+91-9876543212',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amit',
      specialization: ['Computer Science'],
      experience_years: 10,
    },
    {
      id: '4',
      full_name: 'Ms. Neha Patel',
      email: 'neha@simplelecture.com',
      phone_number: '+91-9876543213',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=neha',
      specialization: ['English'],
      experience_years: 8,
    },
  ];

  const displayInstructors = teachers.length > 0 ? teachers : mockInstructors;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Instructors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

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
            {displayInstructors.map((instructor) => (
              <div
                key={instructor.id}
                className="flex gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={instructor.avatar_url || undefined} />
                  <AvatarFallback>
                    {instructor.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1">{instructor.full_name}</h4>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {instructor.specialization?.map((subject, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    {instructor.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{instructor.email}</span>
                      </div>
                    )}
                    {instructor.phone_number && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{instructor.phone_number}</span>
                      </div>
                    )}
                    {instructor.experience_years && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {instructor.experience_years} years experience
                      </div>
                    )}
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