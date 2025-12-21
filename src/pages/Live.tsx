import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveTimetable, DAYS, TimetableClass } from "@/hooks/useLiveTimetable";
import { useRecordAttendance } from "@/hooks/useRecordAttendance";
import { format, isToday, isTomorrow, startOfWeek, addWeeks, subWeeks, isSameWeek, addDays } from "date-fns";
import { Video, Clock, User, MapPin, BookOpen, Radio, Calendar, ArrowRight, ChevronLeft, ChevronRight, BarChart3, PlayCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { AttendanceDashboard } from "@/components/learning/AttendanceDashboard";
import { RecordingsTab } from "@/components/learning/RecordingsTab";
import { useQueryClient } from "@tanstack/react-query";

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
  const { data, isLoading, refetch } = useLiveTimetable();
  const queryClient = useQueryClient();

  // Real-time subscription for live class updates
  useEffect(() => {
    const channel = supabase
      .channel('live-class-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_classes',
        },
        () => {
          // Refetch data when any scheduled class changes
          refetch();
          queryClient.invalidateQueries({ queryKey: ['live-classes'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, queryClient]);

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

          {/* Main Tabs with Schedule, Attendance, Recordings */}
          <MainTabs today={today} week={week} />
        </div>
      </main>
      <Footer />
    </>
  );
};

// Main tabs component with Schedule, Attendance, and Recordings
const MainTabs = ({ today, week }: { today: TimetableClass[]; week: TimetableClass[] }) => {
  return (
    <Tabs defaultValue="schedule" className="mt-8">
      <TabsList className="mb-6">
        <TabsTrigger value="schedule" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Schedule
        </TabsTrigger>
        <TabsTrigger value="attendance" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Attendance
        </TabsTrigger>
        <TabsTrigger value="recordings" className="flex items-center gap-2">
          <PlayCircle className="h-4 w-4" />
          Recordings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="schedule">
        <WeeklySchedule today={today} week={week} />
      </TabsContent>

      <TabsContent value="attendance">
        <AttendanceDashboard />
      </TabsContent>

      <TabsContent value="recordings">
        <RecordingsTab />
      </TabsContent>
    </Tabs>
  );
};

// Separate component for weekly schedule with navigation
const WeeklySchedule = ({ today, week }: { today: TimetableClass[]; week: TimetableClass[] }) => {
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => 
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );

  const weekDates = useMemo(() => {
    return DAYS.map((_, idx) => addDays(selectedWeekStart, idx));
  }, [selectedWeekStart]);

  const isCurrentWeek = useMemo(() => {
    return isSameWeek(selectedWeekStart, new Date(), { weekStartsOn: 0 });
  }, [selectedWeekStart]);

  const handlePreviousWeek = () => {
    setSelectedWeekStart(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setSelectedWeekStart(prev => addWeeks(prev, 1));
  };

  const handleToday = () => {
    setSelectedWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  // Filter week classes for selected week
  const filteredWeek = useMemo(() => {
    return week.filter(classItem => {
      const classDate = classItem.scheduled_date;
      return isSameWeek(classDate, selectedWeekStart, { weekStartsOn: 0 });
    });
  }, [week, selectedWeekStart]);

  return (
    <Tabs defaultValue="today" className="mt-8">
      <TabsList className="mb-6">
        <TabsTrigger value="today">Today ({today.length})</TabsTrigger>
        <TabsTrigger value="week">This Week ({filteredWeek.length})</TabsTrigger>
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
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6 p-3 bg-muted/30 rounded-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousWeek}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center gap-3">
            <span className="font-semibold">
              {format(weekDates[0], "MMM d")} - {format(weekDates[6], "MMM d, yyyy")}
            </span>
            {!isCurrentWeek && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Today
              </Button>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextWeek}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {filteredWeek.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Classes This Week</h3>
            <p className="text-muted-foreground">You don't have any scheduled classes for the selected week.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {DAYS.map((day, dayIndex) => {
              const dayClasses = filteredWeek.filter(c => c.day_of_week === dayIndex);
              if (dayClasses.length === 0) return null;

              const dayDate = weekDates[dayIndex];

              return (
                <div key={day}>
                  <h3 className="text-lg font-semibold mb-3">
                    {day}
                    <span className="font-normal text-muted-foreground ml-2">
                      {format(dayDate, "MMMM d, yyyy")}
                    </span>
                  </h3>
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
  );
};

export default LivePage;
