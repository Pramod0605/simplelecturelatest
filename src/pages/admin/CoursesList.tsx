import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDeleteCourse } from "@/hooks/useAdminCourses";
import { useAdminCoursesFiltered } from "@/hooks/useAdminCoursesFiltered";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";

export default function CoursesList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState<string>("all");
  const [subCategoryId, setSubCategoryId] = useState<string>("all");

  const { data: categories } = useAdminCategories();
  const { data: courses, isLoading } = useAdminCoursesFiltered({
    categoryId: parentCategoryId,
    subCategoryId: subCategoryId,
    searchTerm: searchTerm,
  });
  const deleteCourse = useDeleteCourse();

  const parentCategories = useMemo(() => 
    categories?.filter(c => c.level === 1) || [], 
    [categories]
  );

  const subCategories = useMemo(() => 
    categories?.filter(c => c.parent_id === parentCategoryId && parentCategoryId !== "all") || [],
    [categories, parentCategoryId]
  );

  const handleParentCategoryChange = (value: string) => {
    setParentCategoryId(value);
    setSubCategoryId("all");
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setParentCategoryId("all");
    setSubCategoryId("all");
  };

  const hasActiveFilters = searchTerm || parentCategoryId !== "all" || subCategoryId !== "all";

  const handleDelete = async (courseId: string) => {
    if (confirm("Are you sure you want to delete this course?")) {
      deleteCourse.mutate(courseId);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground">Manage your courses</p>
        </div>
        <Button onClick={() => navigate("/admin/courses/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={parentCategoryId} onValueChange={handleParentCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {parentCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={subCategoryId} 
                onValueChange={setSubCategoryId}
                disabled={parentCategoryId === "all" || subCategories.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sub-category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sub-Categories</SelectItem>
                  {subCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetFilters}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            All Courses {courses && courses.length > 0 && `(${courses.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading courses...</p>
          ) : courses && courses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell className="text-muted-foreground">{course.slug}</TableCell>
                    <TableCell>₹{course.price_inr || 0}</TableCell>
                    <TableCell>
                      <Badge variant={course.is_active ? "default" : "secondary"}>
                        {course.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(course.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No courses found. Create your first course to get started.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
