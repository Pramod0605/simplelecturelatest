import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateLiveClassFromTimetable } from "@/hooks/useInstructorTimetable";
import { useInstructors } from "@/hooks/useInstructors";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LiveClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData?: any;
  timetableEntry?: any;
}

export const LiveClassDialog = ({ open, onOpenChange, classData, timetableEntry }: LiveClassDialogProps) => {
  const [formData, setFormData] = useState({
    subject: "",
    course_id: "",
    teacher_id: "",
    scheduled_at: "",
    duration_minutes: "60",
    meeting_link: "",
    room_number: "",
    notes: "",
    chapter_id: "",
  });

  const { data: instructors } = useInstructors();
  const createClass = useCreateLiveClassFromTimetable();

  useEffect(() => {
    if (timetableEntry) {
      setFormData({
        ...formData,
        subject: timetableEntry.subject?.name || "",
        teacher_id: timetableEntry.instructor_id || "",
        chapter_id: timetableEntry.chapter_id || "",
        duration_minutes: timetableEntry.duration_minutes?.toString() || "60",
      });
    } else if (classData) {
      setFormData({
        subject: classData.subject || "",
        course_id: classData.course_id || "",
        teacher_id: classData.teacher_id || "",
        scheduled_at: classData.scheduled_at || "",
        duration_minutes: classData.duration_minutes?.toString() || "60",
        meeting_link: classData.meeting_link || "",
        room_number: classData.room_number || "",
        notes: classData.notes || "",
        chapter_id: classData.chapter_id || "",
      });
    }
  }, [classData, timetableEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      duration_minutes: parseInt(formData.duration_minutes),
      scheduled_at: new Date(formData.scheduled_at).toISOString(),
      timetable_entry_id: timetableEntry?.id || null,
      is_live: false,
      is_cancelled: false,
    };

    await createClass.mutateAsync(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {classData ? "Edit" : "Create"} Live Class
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Instructor *</Label>
              <Select
                value={formData.teacher_id}
                onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select instructor" />
                </SelectTrigger>
                <SelectContent>
                  {instructors?.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="scheduled_at">Date & Time *</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
              <Input
                id="duration_minutes"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="meeting_link">Meeting Link</Label>
              <Input
                id="meeting_link"
                type="url"
                placeholder="https://zoom.us/j/..."
                value={formData.meeting_link}
                onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="room_number">Room Number</Label>
              <Input
                id="room_number"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes / Description</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit">
              {classData ? "Update" : "Create"} Live Class
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
