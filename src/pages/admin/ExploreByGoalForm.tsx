import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import {
  useAdminGoal,
  useCreateGoal,
  useUpdateGoal,
} from "@/hooks/useAdminExploreByGoal";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

export default function ExploreByGoalForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const { data: goal } = useAdminGoal(id);
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      icon: "",
      display_order: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (goal) {
      form.reset({
        name: goal.name,
        slug: goal.slug,
        description: goal.description || "",
        icon: goal.icon || "",
        display_order: goal.display_order,
        is_active: goal.is_active,
      });
    }
  }, [goal, form]);

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
      updateGoal.mutate(
        { id, ...data },
        {
          onSuccess: () => navigate("/admin/explore-by-goal"),
        }
      );
    } else {
      createGoal.mutate(data as any, {
        onSuccess: () => navigate("/admin/explore-by-goal"),
      });
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/explore-by-goal")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? "Edit Goal" : "Add Goal"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? "Update goal details" : "Create a new learning goal"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Goal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Crack NEET" {...field} />
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
                      <Input placeholder="e.g., crack-neet" {...field} />
                    </FormControl>
                    <FormDescription>
                      URL-friendly identifier
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon (Emoji)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 🎯" {...field} />
                    </FormControl>
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
                        placeholder="Brief description of this goal..."
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
                      Lower numbers appear first
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
                        Make this goal visible to users
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
              disabled={createGoal.isPending || updateGoal.isPending}
            >
              {isEdit ? "Update Goal" : "Create Goal"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/explore-by-goal")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
