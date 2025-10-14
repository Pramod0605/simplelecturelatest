import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, BookOpen, List, Brain } from "lucide-react";
import {
  useAdminSubject,
  useCreateSubject,
  useUpdateSubject,
} from "@/hooks/useAdminPopularSubjects";
import { SubjectChaptersTab } from "@/components/admin/SubjectChaptersTab";
import { SubjectQuestionsTab } from "@/components/admin/SubjectQuestionsTab";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  description: z.string().max(500).optional(),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

export default function SubjectForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [activeTab, setActiveTab] = useState("basic");

  const { data: subject } = useAdminSubject(id);
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      display_order: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (subject) {
      form.reset({
        name: subject.name,
        slug: subject.slug,
        description: subject.description || "",
        display_order: subject.display_order,
        is_active: subject.is_active,
      });
    }
  }, [subject, form]);

  const nameValue = form.watch("name");
  useEffect(() => {
    if (nameValue && !isEdit) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      form.setValue("slug", slug);
    }
  }, [nameValue, isEdit, form]);

  const onSubmit = (data: FormData) => {
    if (isEdit && id) {
      updateSubject.mutate(
        { id, ...data },
        {
          onSuccess: () => {
            // Stay on form to allow editing other tabs
          },
        }
      );
    } else {
      createSubject.mutate(data as any, {
        onSuccess: (newSubject) => {
          // Redirect to edit mode after creation
          navigate(`/admin/subjects/${newSubject.id}/edit`);
        },
      });
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/popular-subjects")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? "Edit Subject" : "Add Subject"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? "Manage subject details, chapters, and questions" : "Create a new subject"}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="chapters" disabled={!isEdit} className="gap-2">
            <List className="h-4 w-4" />
            Chapters & Topics
          </TabsTrigger>
          <TabsTrigger value="questions" disabled={!isEdit} className="gap-2">
            <Brain className="h-4 w-4" />
            Questions
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Basic Information */}
        <TabsContent value="basic">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subject Information</CardTitle>
                  <CardDescription>
                    Basic details about the subject
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Physics (NEET/JEE)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., physics-neet-jee" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL-friendly identifier (auto-generated)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of this subject..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="display_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Lower numbers appear first in lists
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Status</FormLabel>
                          <FormDescription>
                            Make this subject visible to users
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  disabled={createSubject.isPending || updateSubject.isPending}
                >
                  {createSubject.isPending || updateSubject.isPending
                    ? "Saving..."
                    : isEdit
                    ? "Update Subject"
                    : "Create Subject"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/popular-subjects")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* Tab 2: Chapters & Topics */}
        <TabsContent value="chapters">
          {isEdit && id ? (
            <SubjectChaptersTab subjectId={id} subjectName={subject?.name || ""} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Save the subject first to manage chapters and topics
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 3: Questions */}
        <TabsContent value="questions">
          {isEdit && id ? (
            <SubjectQuestionsTab subjectId={id} subjectName={subject?.name || ""} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Save the subject first to manage questions
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
