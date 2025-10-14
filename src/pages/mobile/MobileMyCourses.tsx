import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Clock, ChevronRight } from 'lucide-react';
import { useMyCourses } from '@/hooks/useMyCourses';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

const MobileMyCourses = () => {
  const navigate = useNavigate();
  const { data: subjects, isLoading } = useMyCourses();
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');

  // Get unique course names
  const courseNames = useMemo(() => {
    if (!subjects || subjects.length === 0) return ['ALL'];
    const names = Array.from(new Set(subjects.map(s => s.courseName)));
    return ['ALL', ...names];
  }, [subjects]);

  // Filter subjects by selected course
  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    if (selectedCourse === 'ALL') return subjects;
    return subjects.filter(s => s.courseName === selectedCourse);
  }, [subjects, selectedCourse]);

  const handleSubjectClick = (subject: any) => {
    navigate(`/learning/${subject.courseId}/${subject.subjectName}`);
  };

  return (
    <MobileLayout title="My Courses">
      <div className="p-4 space-y-4">
        {/* Course Filter Tabs */}
        <Tabs value={selectedCourse} onValueChange={setSelectedCourse}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {courseNames.map((course) => (
              <TabsTrigger key={course} value={course} className="whitespace-nowrap">
                {course}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Skeleton className="h-20 w-20 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredSubjects.length === 0 && (
          <Card className="p-8 text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedCourse === 'ALL' 
                ? "You haven't enrolled in any courses yet"
                : `No subjects found in ${selectedCourse}`
              }
            </p>
            <Button onClick={() => navigate('/mobile/explore')}>
              Explore Programs
            </Button>
          </Card>
        )}

        {/* Subject Cards List */}
        {!isLoading && filteredSubjects.length > 0 && (
          <div className="space-y-3">
            {filteredSubjects.map((subject) => (
              <Card
                key={subject.id}
                className="overflow-hidden cursor-pointer active:scale-98 transition-transform"
                onClick={() => handleSubjectClick(subject)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Subject Thumbnail */}
                    <div className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={subject.thumbnail}
                        alt={subject.subjectName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Subject Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm line-clamp-1">
                            {subject.subjectName}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {subject.subjectCode}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>

                      {/* Instructor Info */}
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={subject.instructorAvatar} />
                          <AvatarFallback className="text-[10px]">
                            {subject.instructorName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate">
                          {subject.instructorName}
                        </span>
                      </div>

                      {/* Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {subject.chaptersCompleted}/{subject.totalChapters} chapters
                          </span>
                          <span className="font-semibold">{subject.progress}%</span>
                        </div>
                        <Progress value={subject.progress} className="h-1.5" />
                      </div>

                      {/* Last Accessed */}
                      {subject.lastAccessed && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(subject.lastAccessed, { addSuffix: true })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button className="w-full mt-3" size="sm">
                    {subject.progress > 0 ? 'Continue Learning' : 'Start Learning'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default MobileMyCourses;