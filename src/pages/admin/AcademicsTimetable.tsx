import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useCourses } from "@/hooks/useCourses";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function AcademicsTimetable() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [generatorSettings, setGeneratorSettings] = useState({
    startTime: "09:00",
    duration: "45",
    interval: "10",
    roomNo: "",
  });

  const { data: categories } = useAdminCategories();
  const { data: allCourses } = useCourses();
  
  // Filter courses by selected category  
  const courses = allCourses;

  const [dayEntries, setDayEntries] = useState<Record<number, any[]>>({
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    0: [],
  });

  const handleQuickGenerate = () => {
    const { startTime, duration, interval } = generatorSettings;
    if (!startTime || !duration) {
      toast.error("Please fill in all generator settings");
      return;
    }

    const newEntries: Record<number, any[]> = {};
    DAYS.forEach((_, dayIdx) => {
      const dayOfWeek = dayIdx === 6 ? 0 : dayIdx + 1; // Convert to 0=Sunday format
      newEntries[dayOfWeek] = [{
        subject_id: "",
        instructor_id: "",
        start_time: startTime,
        end_time: addMinutes(startTime, parseInt(duration)),
        room_number: generatorSettings.roomNo,
      }];
    });

    setDayEntries(newEntries);
    toast.success("Timetable template generated");
  };

  const addMinutes = (time: string, minutes: number) => {
    const [hours, mins] = time.split(":").map(Number);
    const totalMins = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    return `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`;
  };

  const addEntryToDay = (dayOfWeek: number) => {
    const lastEntry = dayEntries[dayOfWeek]?.[dayEntries[dayOfWeek].length - 1];
    const newStartTime = lastEntry
      ? addMinutes(lastEntry.end_time, parseInt(generatorSettings.interval))
      : generatorSettings.startTime;

    setDayEntries({
      ...dayEntries,
      [dayOfWeek]: [
        ...(dayEntries[dayOfWeek] || []),
        {
          subject_id: "",
          instructor_id: "",
          start_time: newStartTime,
          end_time: addMinutes(newStartTime, parseInt(generatorSettings.duration)),
          room_number: generatorSettings.roomNo,
        },
      ],
    });
  };

  const updateEntry = (dayOfWeek: number, index: number, field: string, value: any) => {
    const updated = [...dayEntries[dayOfWeek]];
    updated[index] = { ...updated[index], [field]: value };
    setDayEntries({ ...dayEntries, [dayOfWeek]: updated });
  };

  const removeEntry = (dayOfWeek: number, index: number) => {
    const updated = dayEntries[dayOfWeek].filter((_, i) => i !== index);
    setDayEntries({ ...dayEntries, [dayOfWeek]: updated });
  };

  const handleSaveTimetable = async () => {
    if (!selectedCourse) {
      toast.error("Please select a course");
      return;
    }

    const entries: any[] = [];
    Object.entries(dayEntries).forEach(([day, dayEntriesList]) => {
      dayEntriesList.forEach((entry) => {
        if (entry.subject_id && entry.instructor_id) {
          entries.push({
            course_id: selectedCourse,
            subject_id: entry.subject_id,
            instructor_id: entry.instructor_id,
            day_of_week: parseInt(day),
            start_time: entry.start_time,
            end_time: entry.end_time,
            room_number: entry.room_number,
            academic_year: "2024-2025",
            valid_from: new Date().toISOString().split("T")[0],
            is_active: true,
          });
        }
      });
    });

    if (entries.length === 0) {
      toast.error("Please add at least one complete entry");
      return;
    }

    // TODO: Implement save after Supabase types are regenerated
    toast.info("Timetable save will be implemented after database sync");
    console.log("Entries to save:", entries);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Course Timetable Management</h1>
        <p className="text-muted-foreground">Create and manage course-based timetables</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Course</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.parent_name ? `${cat.name} - ${cat.parent_name}` : cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={!selectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {courses?.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCourse && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Quick Timetable Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Period Start Time</Label>
                  <Input
                    type="time"
                    value={generatorSettings.startTime}
                    onChange={(e) => setGeneratorSettings({ ...generatorSettings, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={generatorSettings.duration}
                    onChange={(e) => setGeneratorSettings({ ...generatorSettings, duration: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Interval (minutes)</Label>
                  <Input
                    type="number"
                    value={generatorSettings.interval}
                    onChange={(e) => setGeneratorSettings({ ...generatorSettings, interval: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Room No.</Label>
                  <Input
                    value={generatorSettings.roomNo}
                    onChange={(e) => setGeneratorSettings({ ...generatorSettings, roomNo: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <Button onClick={handleQuickGenerate} className="mt-4">
                Generate Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Timetable</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="1">
                <TabsList className="grid w-full grid-cols-7">
                  {DAYS.map((day, idx) => (
                    <TabsTrigger key={day} value={String(idx === 6 ? 0 : idx + 1)}>
                      {day.slice(0, 3)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {DAYS.map((day, idx) => {
                  const dayOfWeek = idx === 6 ? 0 : idx + 1;
                  return (
                    <TabsContent key={day} value={String(dayOfWeek)} className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">{day}</h3>
                        <Button size="sm" onClick={() => addEntryToDay(dayOfWeek)}>
                          + Add New
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {dayEntries[dayOfWeek]?.map((entry, entryIdx) => (
                          <div key={entryIdx} className="grid grid-cols-6 gap-2 items-end p-3 border rounded">
                            <div>
                              <Label className="text-xs">Subject</Label>
                              <Input
                                placeholder="Subject ID"
                                value={entry.subject_id}
                                onChange={(e) => updateEntry(dayOfWeek, entryIdx, "subject_id", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Teacher</Label>
                              <Input
                                placeholder="Teacher ID"
                                value={entry.instructor_id}
                                onChange={(e) => updateEntry(dayOfWeek, entryIdx, "instructor_id", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Time From</Label>
                              <Input
                                type="time"
                                value={entry.start_time}
                                onChange={(e) => updateEntry(dayOfWeek, entryIdx, "start_time", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Time To</Label>
                              <Input
                                type="time"
                                value={entry.end_time}
                                onChange={(e) => updateEntry(dayOfWeek, entryIdx, "end_time", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Room No.</Label>
                              <Input
                                value={entry.room_number}
                                onChange={(e) => updateEntry(dayOfWeek, entryIdx, "room_number", e.target.value)}
                              />
                            </div>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => removeEntry(dayOfWeek, entryIdx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        
                        {(!dayEntries[dayOfWeek] || dayEntries[dayOfWeek].length === 0) && (
                          <p className="text-muted-foreground text-center py-8 text-sm">
                            No entries for this day. Click "+ Add New" to create one.
                          </p>
                        )}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveTimetable} size="lg">
                  Save Timetable
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
