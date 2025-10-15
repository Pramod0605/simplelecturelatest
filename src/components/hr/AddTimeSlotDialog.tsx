import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTimetableEntry } from "@/hooks/useInstructorTimetable";
import { useInstructorSubjects } from "@/hooks/useInstructors";
import { useAdminBatches } from "@/hooks/useAdminBatches";

interface AddTimeSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const AddTimeSlotDialog = ({ open, onOpenChange, instructorId }: AddTimeSlotDialogProps) => {
  const { data: instructorSubjects } = useInstructorSubjects(instructorId);
  const { data: batches } = useAdminBatches();
  const createEntry = useCreateTimetableEntry();
  
  const [formData, setFormData] = useState({
    subject_id: "",
    batch_id: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
    room_number: "",
    academic_year: "2024-2025",
    valid_from: new Date().toISOString().split("T")[0],
    valid_until: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createEntry.mutateAsync({
      instructor_id: instructorId,
      subject_id: formData.subject_id || null,
      batch_id: formData.batch_id || null,
      day_of_week: parseInt(formData.day_of_week),
      start_time: formData.start_time,
      end_time: formData.end_time,
      room_number: formData.room_number || null,
      academic_year: formData.academic_year,
      valid_from: formData.valid_from,
      valid_until: formData.valid_until || null,
      is_active: true,
    });

    onOpenChange(false);
    setFormData({
      subject_id: "",
      batch_id: "",
      day_of_week: "",
      start_time: "",
      end_time: "",
      room_number: "",
      academic_year: "2024-2025",
      valid_from: new Date().toISOString().split("T")[0],
      valid_until: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Time Slot</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Subject</Label>
            <Select value={formData.subject_id} onValueChange={(val) => setFormData({ ...formData, subject_id: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {instructorSubjects?.map((is) => (
                  <SelectItem key={is.subject_id} value={is.subject_id || ""}>
                    {is.subject?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Day of Week</Label>
            <Select value={formData.day_of_week} onValueChange={(val) => setFormData({ ...formData, day_of_week: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Time</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>End Time</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Batch (Optional)</Label>
            <Select value={formData.batch_id} onValueChange={(val) => setFormData({ ...formData, batch_id: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {batches?.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Room Number</Label>
            <Input
              value={formData.room_number}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <div>
            <Label>Academic Year</Label>
            <Input
              value={formData.academic_year}
              onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valid From</Label>
              <Input
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createEntry.isPending}>
              {createEntry.isPending ? "Adding..." : "Add Time Slot"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
