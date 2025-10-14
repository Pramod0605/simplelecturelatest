import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import {
  useAdminCategories,
  useAdminCategory,
  useCreateCategory,
  useUpdateCategory,
} from "@/hooks/useAdminCategories";
import { useAdminExploreByGoal } from "@/hooks/useAdminExploreByGoal";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  icon: z.string().optional(),
  description: z.string().max(500).optional(),
  parent_id: z.string().optional(),
  level: z.number().int().min(1).max(3),
  display_order: z.number().int().min(0).default(0),
  is_popular: z.boolean().default(false),
  is_active: z.boolean().default(true),
  goal_ids: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function CategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const { data: categories } = useAdminCategories();
  const { data: category } = useAdminCategory(id);
  const { data: goals } = useAdminExploreByGoal();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      icon: "",
      description: "",
      parent_id: undefined,
      level: 1,
      display_order: 0,
      is_popular: false,
      is_active: true,
      goal_ids: [],
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        slug: category.slug,
        icon: category.icon || "",
        description: category.description || "",
        parent_id: category.parent_id || undefined,
        level: category.level,
        display_order: category.display_order,
        is_popular: category.is_popular,
        is_active: category.is_active,
        goal_ids: category.goal_ids || [],
      });
      setSelectedGoals(category.goal_ids || []);
    }
  }, [category, form]);

  // Auto-generate slug from name
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

  // Auto-calculate level based on parent
  const parentId = form.watch("parent_id");
  useEffect(() => {
    if (parentId && categories) {
      const parent = categories.find((c) => c.id === parentId);
      if (parent) {
        form.setValue("level", parent.level + 1);
      }
    } else {
      form.setValue("level", 1);
    }
  }, [parentId, categories, form]);

  const onSubmit = (data: FormData) => {
    const categoryData = {
      ...data,
      goal_ids: selectedGoals,
    };

    if (isEdit && id) {
      updateCategory.mutate(
        { id, ...categoryData },
        {
          onSuccess: () => navigate("/admin/categories"),
        }
      );
    } else {
      createCategory.mutate(categoryData as any, {
        onSuccess: () => navigate("/admin/categories"),
      });
    }
  };

  const level = form.watch("level");
  // Show categories that can be parents - exclude self if editing, and only show categories with lower level
  const parentCategories = categories?.filter((c) => {
    // Exclude self when editing
    if (isEdit && id && c.id === id) return false;
    // Show all categories with level less than current level
    // If current level is 1, no parents available (will be top-level)
    // If current level is 2, show level 1 categories
    // If current level is 3, show level 1 and 2 categories
    return c.level < level;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/categories")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? "Edit Category" : "Add Category"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? "Update category details" : "Create a new category"}
          </p>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Board Exams" {...field} />
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
                      <Input placeholder="e.g., board-exams" {...field} />
                    </FormControl>
                    <FormDescription>
                      URL-friendly identifier (auto-generated from name)
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
                      <Input placeholder="e.g., 📚 🩺 ⚙️ 🎯" {...field} />
                    </FormControl>
                    <FormDescription>
                      Use emoji to represent this category
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
                        placeholder="Brief description of this category..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hierarchy & Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Category</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        // If "none" is selected, set to undefined
                        field.onChange(value === "none" ? undefined : value);
                      }}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select parent category (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="none">
                          None (Top-level Category - Level 1)
                        </SelectItem>
                        {parentCategories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon && `${cat.icon} `}{cat.name}
                            {cat.parent_name && ` (under ${cat.parent_name})`}
                            {` - Level ${cat.level}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select a parent to create a subcategory. Level will auto-update.
                      {level === 1 && " Currently a top-level category."}
                      {level === 2 && " Currently a subcategory (Level 2)."}
                      {level === 3 && " Currently a sub-subcategory (Level 3)."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        disabled
                      />
                    </FormControl>
                    <FormDescription>
                      Auto-calculated based on parent selection
                    </FormDescription>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Explore by Goal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals && goals.length > 0 ? (
                <div className="space-y-3">
                  {goals.map((goal) => (
                    <div key={goal.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={goal.id}
                        checked={selectedGoals.includes(goal.id)}
                        onCheckedChange={(checked) => {
                          setSelectedGoals(
                            checked
                              ? [...selectedGoals, goal.id]
                              : selectedGoals.filter((id) => id !== goal.id)
                          );
                        }}
                      />
                      <label
                        htmlFor={goal.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {goal.icon && `${goal.icon} `}{goal.name}
                      </label>
                    </div>
                  ))}
                  {selectedGoals.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedGoals.length} goal(s) selected
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No goals available. Add goals from the "Explore by Goal" section first.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="is_popular"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Popular Category</FormLabel>
                      <FormDescription>
                        Mark this as a popular/featured category
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

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Make this category visible to users
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

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={createCategory.isPending || updateCategory.isPending}
            >
              {isEdit ? "Update Category" : "Create Category"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/categories")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
