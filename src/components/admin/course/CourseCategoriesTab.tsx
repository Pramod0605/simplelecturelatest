import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminCategories, getCategoryHierarchyDisplay } from "@/hooks/useAdminCategories";
import { X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface CourseCategoriesTabProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
}

export const CourseCategoriesTab = ({ selectedCategories, onChange }: CourseCategoriesTabProps) => {
  const { data: categories } = useAdminCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const addCategory = () => {
    if (selectedCategoryId && !selectedCategories.includes(selectedCategoryId)) {
      onChange([...selectedCategories, selectedCategoryId]);
      setSelectedCategoryId("");
    }
  };

  const removeCategory = (categoryId: string) => {
    onChange(selectedCategories.filter(id => id !== categoryId));
  };

  const getCategoryDisplay = (categoryId: string) => {
    if (!categories) return "";
    return getCategoryHierarchyDisplay(categoryId, categories);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Add Category</Label>
        <div className="flex gap-2 mt-2">
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {getCategoryHierarchyDisplay(cat.id, categories)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addCategory} type="button">Add</Button>
        </div>
      </div>

      <div>
        <Label>Selected Categories</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedCategories.length === 0 && (
            <p className="text-sm text-muted-foreground">No categories selected</p>
          )}
          {selectedCategories.map((categoryId) => (
            <Badge key={categoryId} variant="secondary" className="flex items-center gap-1">
              {getCategoryDisplay(categoryId)}
              <button
                onClick={() => removeCategory(categoryId)}
                className="ml-1 hover:bg-background rounded-full"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};