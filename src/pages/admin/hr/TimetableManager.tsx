import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useInstructorTimetable } from "@/hooks/useInstructorTimetable";
import { TimetableGrid } from "@/components/hr/TimetableGrid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInstructors } from "@/hooks/useInstructors";

export default function TimetableManager() {
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>("");
  const { data: instructors } = useInstructors();
  const { data: timetable, isLoading } = useInstructorTimetable(selectedInstructorId || undefined);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timetable Management</h1>
          <p className="text-muted-foreground">Manage instructor schedules and create timetables</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Time Slot
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Timetable</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select instructor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Instructors</SelectItem>
              {instructors?.map((inst) => (
                <SelectItem key={inst.id} value={inst.id}>
                  {inst.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading timetable...</p>
          ) : selectedInstructorId ? (
            <TimetableGrid entries={timetable || []} />
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Select an instructor to view their timetable
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
