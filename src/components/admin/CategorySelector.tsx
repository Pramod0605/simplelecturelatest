import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminCategories, getCategoryHierarchyDisplay } from "@/hooks/useAdminCategories";
import { Label } from "@/components/ui/label";

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  showAllOption?: boolean;
  allOptionLabel?: string;
  disabled?: boolean;
}

/**
 * CategorySelector Component
 * 
 * A reusable dropdown component for selecting categories with hierarchical display.
 * Categories are shown in "Child - Parent - Grandparent" format, supporting unlimited nesting levels.
 * 
 * @example
 * ```tsx
 * <CategorySelector
 *   value={categoryId}
 *   onChange={setCategoryId}
 *   label="Category"
 *   placeholder="Select a category"
 * />
 * ```
 * 
 * @example With "All" option
 * ```tsx
 * <CategorySelector
 *   value={categoryId}
 *   onChange={setCategoryId}
 *   showAllOption
 *   allOptionLabel="All Categories"
 * />
 * ```
 */
export const CategorySelector = ({
  value,
  onChange,
  label = "Category",
  placeholder = "Select category",
  showAllOption = false,
  allOptionLabel = "All",
  disabled = false,
}: CategorySelectorProps) => {
  const { data: categories, isLoading } = useAdminCategories();

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Select value={value} onValueChange={onChange} disabled={isLoading || disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          {showAllOption && <SelectItem value="all">{allOptionLabel}</SelectItem>}
          {categories?.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {getCategoryHierarchyDisplay(cat.id, categories)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
