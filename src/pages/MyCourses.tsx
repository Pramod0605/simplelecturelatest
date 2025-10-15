import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/SEO';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3x3, List, BookOpen, Clock } from 'lucide-react';
import { useMyCourses } from '@/hooks/useMyCourses';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const MyCourses = () => {
  const navigate = useNavigate();
  const { data: subjects, isLoading } = useMyCourses();
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    <>
      <SEOHead title="My Courses | SimpleLecture" description="View and manage your enrolled courses" />
      <div className="min-h-screen bg-background">
        <DashboardHeader />

        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Courses</h1>
              <p className="text-muted-foreground">Continue your learning journey</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Course Filter Tabs */}
          <Tabs value={selectedCourse} onValueChange={setSelectedCourse} className="mb-6">
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
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-2 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredSubjects.length === 0 && (
            <Card className="p-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-4">
                {selectedCourse === 'ALL' 
                  ? "You haven't enrolled in any courses yet"
                  : `No subjects found in ${selectedCourse}`
                }
              </p>
              <Button onClick={() => navigate('/courses')}>
                Browse Courses
              </Button>
            </Card>
          )}

          {/* Grid View */}
          {!isLoading && viewMode === 'grid' && filteredSubjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.map((subject) => (
                <Card key={subject.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleSubjectClick(subject)}>
                  <div className="relative h-48">
                    <img src={subject.thumbnail} alt={subject.subjectName} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2">
                      <Avatar className="h-12 w-12 border-2 border-background">
                        <AvatarImage src={subject.instructorAvatar} />
                        <AvatarFallback>{subject.instructorName[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">{subject.instructorName}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Last Updated {format(subject.lastUpdated, 'MM/dd/yyyy')}
                        </p>
                      </div>
                      <Badge variant="outline">{subject.subjectCode}</Badge>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{subject.subjectName}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{subject.courseName}</p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>Chapters {subject.chaptersCompleted}/{subject.totalChapters}</span>
                      </div>
                      {subject.lastAccessed && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{format(subject.lastAccessed, 'MMM dd')}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{subject.progress}%</span>
                      </div>
                      <Progress value={subject.progress} className="h-2" />
                    </div>

                    <Button className="w-full mt-4" onClick={() => handleSubjectClick(subject)}>
                      {subject.progress > 0 ? 'Continue Learning' : 'Start Learning'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* List View */}
          {!isLoading && viewMode === 'list' && filteredSubjects.length > 0 && (
            <div className="space-y-4">
              {filteredSubjects.map((subject) => (
                <Card key={subject.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleSubjectClick(subject)}>
                  <div className="flex">
                    <div className="w-48 h-32 flex-shrink-0">
                      <img src={subject.thumbnail} alt={subject.subjectName} className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="flex-1 p-4 flex items-center">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={subject.instructorAvatar} />
                              <AvatarFallback>{subject.instructorName[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{subject.subjectName}</h3>
                              <p className="text-xs text-muted-foreground">{subject.instructorName}</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{subject.courseName}</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Progress</p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-semibold">{subject.progress}%</span>
                            </div>
                            <Progress value={subject.progress} className="h-2" />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {subject.chaptersCompleted}/{subject.totalChapters} chapters
                          </p>
                        </div>

                        <div className="flex items-center justify-end">
                          <Button onClick={() => handleSubjectClick(subject)}>
                            {subject.progress > 0 ? 'Continue' : 'Start'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
};

export default MyCourses;