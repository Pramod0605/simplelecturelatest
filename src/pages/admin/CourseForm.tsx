import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save } from "lucide-react";
import { useAdminCourse, useCreateCourse, useUpdateCourse } from "@/hooks/useAdminCourses";
import { CourseGeneralTab } from "@/components/admin/course/CourseGeneralTab";
import { CourseCategoriesTab } from "@/components/admin/course/CourseCategoriesTab";
import { CourseSubjectsTab } from "@/components/admin/course/CourseSubjectsTab";
import { CourseContentTab } from "@/components/admin/course/CourseContentTab";
import { CourseFAQsTab } from "@/components/admin/course/CourseFAQsTab";
import { CourseInstructorsTab } from "@/components/admin/course/CourseInstructorsTab";
import { CoursePricingTab } from "@/components/admin/course/CoursePricingTab";
import { toast } from "sonner";

export default function CourseForm() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { data: course } = useAdminCourse(courseId);
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();

  const [formData, setFormData] = useState<any>({
    name: "",
    slug: "",
    program_id: "",
    short_description: "",
    detailed_description: "",
    thumbnail_url: "",
    instructor_name: "",
    instructor_bio: "",
    instructor_avatar_url: "",
    duration_months: 0,
    price_inr: 0,
    original_price_inr: 0,
    what_you_learn: [],
    course_includes: [],
    is_active: true,
    ai_tutoring_enabled: false,
    ai_tutoring_price: 2000,
    live_classes_enabled: false,
    live_classes_price: 2000,
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (course) {
      setFormData({
        name: course.name || "",
        slug: course.slug || "",
        program_id: course.program_id || "",
        short_description: course.short_description || "",
        detailed_description: course.detailed_description || "",
        thumbnail_url: course.thumbnail_url || "",
        instructor_name: course.instructor_name || "",
        instructor_bio: course.instructor_bio || "",
        instructor_avatar_url: course.instructor_avatar_url || "",
        duration_months: course.duration_months || 0,
        price_inr: course.price_inr || 0,
        original_price_inr: course.original_price_inr || 0,
        what_you_learn: course.what_you_learn || [],
        course_includes: course.course_includes || [],
        is_active: course.is_active ?? true,
        ai_tutoring_enabled: course.ai_tutoring_enabled || false,
        ai_tutoring_price: course.ai_tutoring_price || 2000,
        live_classes_enabled: course.live_classes_enabled || false,
        live_classes_price: course.live_classes_price || 2000,
      });
    }
  }, [course]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name
    if (field === "name" && !courseId) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      setFormData((prev: any) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug) {
      toast.error("Please fill in required fields");
      return;
    }

    // For now, use a default program_id if not set
    const dataToSubmit = {
      ...formData,
      program_id: formData.program_id || "00000000-0000-0000-0000-000000000000",
    };

    if (courseId) {
      updateCourse.mutate(
        { id: courseId, ...dataToSubmit },
        {
          onSuccess: () => {
            toast.success("Course updated successfully");
          },
        }
      );
    } else {
      createCourse.mutate(dataToSubmit, {
        onSuccess: (data) => {
          toast.success("Course created successfully");
          navigate(`/admin/courses/${data.id}/edit`);
        },
      });
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/courses")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {courseId ? "Edit Course" : "Create New Course"}
            </h1>
            <p className="text-muted-foreground">
              {courseId ? "Update course details" : "Add a new course to your platform"}
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={createCourse.isPending || updateCourse.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {courseId ? "Update" : "Create"} Course
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
              <TabsTrigger value="instructors" disabled={!courseId}>Instructors</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="content" disabled={!courseId}>Content</TabsTrigger>
              <TabsTrigger value="faqs" disabled={!courseId}>FAQs</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 pt-6">
              <CourseGeneralTab formData={formData} onChange={handleChange} />
            </TabsContent>

            <TabsContent value="categories" className="space-y-6 pt-6">
              <CourseCategoriesTab
                selectedCategories={selectedCategories}
                onChange={setSelectedCategories}
              />
            </TabsContent>

            <TabsContent value="subjects" className="space-y-6 pt-6">
              <CourseSubjectsTab courseId={courseId} selectedCategories={selectedCategories} />
            </TabsContent>

            <TabsContent value="instructors" className="space-y-6 pt-6">
              <CourseInstructorsTab courseId={courseId} />
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6 pt-6">
              <CoursePricingTab formData={formData} onChange={handleChange} />
            </TabsContent>

            <TabsContent value="content" className="space-y-6 pt-6">
              <CourseContentTab courseId={courseId} />
            </TabsContent>

            <TabsContent value="faqs" className="space-y-6 pt-6">
              <CourseFAQsTab
                courseId={courseId}
                courseName={formData.name}
                shortDescription={formData.short_description}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}