import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useInstructors, useCreateInstructor, useUpdateInstructor, useInstructor } from "@/hooks/useInstructors";
import { DepartmentSelector } from "@/components/hr/DepartmentSelector";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { InstructorSubjectMapper } from "@/components/hr/InstructorSubjectMapper";
import { ImageUploadWidget } from "@/components/admin/ImageUploadWidget";
import { AIImageGenerator } from "@/components/admin/AIImageGenerator";
import { AddTimeSlotDialog } from "@/components/hr/AddTimeSlotDialog";
import { InstructorTimetableView } from "@/components/hr/InstructorTimetableView";
import { useInstructorTimetable } from "@/hooks/useInstructorTimetable";

export default function InstructorsManager() {
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showTimeSlotDialog, setShowTimeSlotDialog] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    employee_id: "",
    date_of_joining: "",
    department_id: "",
    qualification: "",
    experience_years: "",
    bio: "",
    avatar_url: "",
  });

  const { data: instructors, isLoading } = useInstructors();
  const { data: selectedInstructor } = useInstructor(selectedInstructorId || "");
  const createInstructor = useCreateInstructor();
  const updateInstructor = useUpdateInstructor();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
      department_id: formData.department_id || null,
    };

    if (selectedInstructorId && editMode) {
      await updateInstructor.mutateAsync({ id: selectedInstructorId, data });
    } else {
      const result = await createInstructor.mutateAsync(data);
      if (result) {
        setSelectedInstructorId(result.id);
      }
    }
    
    setEditMode(false);
  };

  const handleEdit = (inst: any) => {
    setSelectedInstructorId(inst.id);
    setFormData({
      full_name: inst.full_name || "",
      email: inst.email || "",
      phone_number: inst.phone_number || "",
      employee_id: inst.employee_id || "",
      date_of_joining: inst.date_of_joining || "",
      department_id: inst.department_id || "",
      qualification: inst.qualification || "",
      experience_years: inst.experience_years?.toString() || "",
      bio: inst.bio || "",
      avatar_url: inst.avatar_url || "",
    });
    setEditMode(true);
  };

  const handleCreateNew = () => {
    setSelectedInstructorId(null);
    setEditMode(true);
    setFormData({
      full_name: "",
      email: "",
      phone_number: "",
      employee_id: "",
      date_of_joining: "",
      department_id: "",
      qualification: "",
      experience_years: "",
      bio: "",
      avatar_url: "",
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Instructors</h1>
          <p className="text-muted-foreground">Manage instructor profiles and assignments</p>
        </div>
        <Button onClick={handleCreateNew}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Instructor
        </Button>
      </div>

      <Tabs defaultValue="list" value={editMode || selectedInstructorId ? "form" : "list"}>
        <TabsList>
          <TabsTrigger value="list" onClick={() => { setEditMode(false); setSelectedInstructorId(null); }}>
            Instructors List
          </TabsTrigger>
          {(editMode || selectedInstructorId) && (
            <TabsTrigger value="form">
              {editMode ? (selectedInstructorId ? "Edit" : "Add") : "View"} Instructor
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>All Instructors</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instructors?.map((inst) => (
                      <TableRow key={inst.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={inst.avatar_url || undefined} />
                              <AvatarFallback>{inst.full_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{inst.full_name}</p>
                              <p className="text-sm text-muted-foreground">{inst.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{inst.employee_id || "-"}</TableCell>
                        <TableCell>{inst.department?.name || "-"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {inst.subjects?.slice(0, 2).map((s: any) => (
                              <Badge key={s.id} variant="secondary" className="text-xs">
                                {s.subject?.name}
                              </Badge>
                            ))}
                            {inst.subjects && inst.subjects.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{inst.subjects.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(inst)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">Basic Details</TabsTrigger>
              {selectedInstructorId && (
                <>
                  <TabsTrigger value="subjects">Subject Mapping</TabsTrigger>
                  <TabsTrigger value="timetable">Timetable</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          required
                          disabled={!editMode}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          disabled={!editMode}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input
                          id="phone_number"
                          value={formData.phone_number}
                          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                          disabled={!editMode}
                        />
                      </div>
                      <div>
                        <Label htmlFor="employee_id">Employee ID</Label>
                        <Input
                          id="employee_id"
                          value={formData.employee_id}
                          onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                          disabled={!editMode}
                        />
                      </div>
                      <div>
                        <Label htmlFor="date_of_joining">Date of Joining</Label>
                        <Input
                          id="date_of_joining"
                          type="date"
                          value={formData.date_of_joining}
                          onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                          disabled={!editMode}
                        />
                      </div>
                      <div>
                        <Label htmlFor="experience_years">Experience (Years)</Label>
                        <Input
                          id="experience_years"
                          type="number"
                          value={formData.experience_years}
                          onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                          disabled={!editMode}
                        />
                      </div>
                    </div>
                    
                    <DepartmentSelector
                      value={formData.department_id}
                      onChange={(value) => setFormData({ ...formData, department_id: value })}
                    />

                    <div>
                      <Label htmlFor="avatar_url">Instructor Photo</Label>
                      <ImageUploadWidget
                        label=""
                        value={formData.avatar_url}
                        onChange={(url) => setFormData({ ...formData, avatar_url: url })}
                        onFileSelect={async (file) => { return ""; }}
                      />
                    </div>

                    {editMode && (
                      <>
                        <AIImageGenerator
                          suggestedPrompt={`Professional instructor photo for ${formData.full_name || 'teacher'}. Modern classroom setting, professional photography style, warm lighting.`}
                          onImageGenerated={(url) => setFormData({ ...formData, avatar_url: url })}
                        />
                      </>
                    )}

                    <div>
                      <Label htmlFor="qualification">Qualification</Label>
                      <Input
                        id="qualification"
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        disabled={!editMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        disabled={!editMode}
                      />
                    </div>

                    {editMode && (
                      <div className="flex gap-2">
                        <Button type="submit">
                          {selectedInstructorId ? "Update" : "Create"} Instructor
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setEditMode(false)}>
                          Cancel
                        </Button>
                      </div>
                    )}
                    {!editMode && selectedInstructorId && (
                      <Button type="button" onClick={() => setEditMode(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Details
                      </Button>
                    )}
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {selectedInstructorId && (
              <>
                <TabsContent value="subjects">
                  <InstructorSubjectMapper instructorId={selectedInstructorId} />
                </TabsContent>
                <TabsContent value="timetable">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Instructor Timetable</CardTitle>
                        <Button onClick={() => setShowTimeSlotDialog(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Time Slot
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <InstructorTimetableView instructorId={selectedInstructorId} />
                    </CardContent>
                  </Card>
                  <AddTimeSlotDialog
                    open={showTimeSlotDialog}
                    onOpenChange={setShowTimeSlotDialog}
                    instructorId={selectedInstructorId}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
