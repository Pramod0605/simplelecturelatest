import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveTimetable, DAYS, TimetableClass } from "@/hooks/useLiveTimetable";
import { format, isToday, isTomorrow } from "date-fns";
import { Video, Clock, User, MapPin, BookOpen, Radio, Calendar, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const ClassCard = ({ classItem, showDate = false }: { classItem: TimetableClass; showDate?: boolean }) => {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getDateLabel = () => {
    if (isToday(classItem.scheduled_date)) return "Today";
    if (isTomorrow(classItem.scheduled_date)) return "Tomorrow";
    return format(classItem.scheduled_date, "EEE, MMM d");
  };

  return (
    <Card className={`p-4 transition-all ${classItem.is_live ? 'border-red-500 border-2 bg-red-50 dark:bg-red-950/20' : 'hover:shadow-md'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {classItem.is_live && (
              <Badge variant="destructive" className="animate-pulse flex items-center gap-1">
                <Radio className="h-3 w-3" />
                LIVE NOW
              </Badge>
            )}
            {!classItem.is_live && classItem.is_upcoming && (
              <Badge variant="secondary">Upcoming</Badge>
            )}
            {showDate && (
              <Badge variant="outline">{getDateLabel()}</Badge>
            )}
          </div>
          <h3 className="font-semibold text-lg">{classItem.subject_name}</h3>
          <p className="text-sm text-muted-foreground">{classItem.course_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
        </div>
        {classItem.instructor_name && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {classItem.instructor_name}
          </div>
        )}
        {classItem.room_number && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {classItem.room_number}
          </div>
        )}
        {classItem.batch_name && (
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {classItem.batch_name}
          </div>
        )}
      </div>

      {classItem.meeting_link ? (
        <Button className="w-full" variant={classItem.is_live ? "destructive" : "default"} asChild>
          <a href={classItem.meeting_link} target="_blank" rel="noopener noreferrer">
            <Video className="h-4 w-4 mr-2" />
            {classItem.is_live ? "Join Live Class" : "Join Class"}
          </a>
        </Button>
      ) : (
        <Button className="w-full" variant="outline" disabled>
          <Video className="h-4 w-4 mr-2" />
          No Meeting Link
        </Button>
      )}
    </Card>
  );
};

const LivePage = () => {
  const { data, isLoading } = useLiveTimetable();

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background py-8">
          <div className="container mx-auto px-4">
            <Skeleton className="h-10 w-64 mb-6" />
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { today = [], week = [], current, next } = data || {};

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              My Class Schedule
            </h1>
            <p className="text-muted-foreground">View your live and upcoming classes based on your enrolled courses</p>
          </div>

          {/* Current/Live Class */}
          {current && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Radio className="h-5 w-5 text-red-500 animate-pulse" />
                Live Now
              </h2>
              <div className="max-w-xl">
                <ClassCard classItem={current} />
              </div>
            </div>
          )}

          {/* Next Class */}
          {next && !current && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-primary" />
                Next Up
              </h2>
              <div className="max-w-xl">
                <ClassCard classItem={next} showDate />
              </div>
            </div>
          )}

          {/* Tabs for Today / Week */}
          <Tabs defaultValue="today" className="mt-8">
            <TabsList className="mb-6">
              <TabsTrigger value="today">Today ({today.length})</TabsTrigger>
              <TabsTrigger value="week">This Week ({week.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="today">
              {today.length === 0 ? (
                <Card className="p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Classes Today</h3>
                  <p className="text-muted-foreground">You don't have any scheduled classes for today.</p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {today.map((classItem) => (
                    <ClassCard key={classItem.id} classItem={classItem} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="week">
              {week.length === 0 ? (
                <Card className="p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Classes This Week</h3>
                  <p className="text-muted-foreground">You don't have any scheduled classes for this week.</p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {DAYS.map((day, dayIndex) => {
                    const dayClasses = week.filter(c => c.day_of_week === dayIndex);
                    if (dayClasses.length === 0) return null;

                    return (
                      <div key={day}>
                        <h3 className="text-lg font-semibold mb-3 text-muted-foreground">{day}</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {dayClasses.map((classItem) => (
                            <ClassCard key={classItem.id} classItem={classItem} showDate />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default LivePage;
