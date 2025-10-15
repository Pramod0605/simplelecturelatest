import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Plus, X } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAICourseContent } from "@/hooks/useAICourseContent";
import { toast } from "sonner";

interface CourseGeneralTabProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const CourseGeneralTab = ({ formData, onChange }: CourseGeneralTabProps) => {
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [aiType, setAIType] = useState<"short" | "detailed" | "what_you_learn" | "course_includes">("short");
  const [newLearnItem, setNewLearnItem] = useState("");
  const [newIncludeItem, setNewIncludeItem] = useState({ icon: "Video", text: "" });
  
  const generateContent = useAICourseContent();

  const handleAIGenerate = async () => {
    const type = aiType === "short" || aiType === "detailed" ? "description" : aiType;
    
    generateContent.mutate({
      type: type as any,
      context: {
        courseName: formData.name || "Untitled Course",
        shortDescription: aiType === "detailed" ? formData.short_description : undefined,
      },
    }, {
      onSuccess: (data) => {
        if (aiType === "short") {
          onChange("short_description", data.content);
        } else if (aiType === "detailed") {
          onChange("detailed_description", data.content);
        } else if (aiType === "what_you_learn") {
          const existing = formData.what_you_learn || [];
          onChange("what_you_learn", [...existing, ...(Array.isArray(data.content) ? data.content : [data.content])]);
        } else if (aiType === "course_includes") {
          const existing = formData.course_includes || [];
          onChange("course_includes", [...existing, ...(Array.isArray(data.content) ? data.content : [data.content])]);
        }
        setIsAIDialogOpen(false);
        toast.success("Content generated successfully!");
      },
    });
  };

  const addLearnItem = () => {
    if (newLearnItem.trim()) {
      const existing = formData.what_you_learn || [];
      onChange("what_you_learn", [...existing, newLearnItem.trim()]);
      setNewLearnItem("");
    }
  };

  const removeLearnItem = (index: number) => {
    const existing = formData.what_you_learn || [];
    onChange("what_you_learn", existing.filter((_: any, i: number) => i !== index));
  };

  const addIncludeItem = () => {
    if (newIncludeItem.text.trim()) {
      const existing = formData.course_includes || [];
      onChange("course_includes", [...existing, { ...newIncludeItem }]);
      setNewIncludeItem({ icon: "Video", text: "" });
    }
  };

  const removeIncludeItem = (index: number) => {
    const existing = formData.course_includes || [];
    onChange("course_includes", existing.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Course Name *</Label>
          <Input
            id="name"
            value={formData.name || ""}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Enter course name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={formData.slug || ""}
            onChange={(e) => onChange("slug", e.target.value)}
            placeholder="course-slug"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="short_description">Short Description</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setAIType("short");
              setIsAIDialogOpen(true);
            }}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Generate with AI
          </Button>
        </div>
        <Textarea
          id="short_description"
          value={formData.short_description || ""}
          onChange={(e) => onChange("short_description", e.target.value)}
          placeholder="Brief course overview (max 200 chars)"
          maxLength={200}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="detailed_description">Detailed Description</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setAIType("detailed");
              setIsAIDialogOpen(true);
            }}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Generate with AI
          </Button>
        </div>
        <Textarea
          id="detailed_description"
          value={formData.detailed_description || ""}
          onChange={(e) => onChange("detailed_description", e.target.value)}
          placeholder="Full course details"
          rows={6}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
          <Input
            id="thumbnail_url"
            value={formData.thumbnail_url || ""}
            onChange={(e) => onChange("thumbnail_url", e.target.value)}
            placeholder="https://..."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="instructor_name">Instructor Name</Label>
          <Input
            id="instructor_name"
            value={formData.instructor_name || ""}
            onChange={(e) => onChange("instructor_name", e.target.value)}
            placeholder="Instructor name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructor_bio">Instructor Bio</Label>
        <Textarea
          id="instructor_bio"
          value={formData.instructor_bio || ""}
          onChange={(e) => onChange("instructor_bio", e.target.value)}
          placeholder="Instructor biography"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration_months">Duration (months)</Label>
          <Input
            id="duration_months"
            type="number"
            value={formData.duration_months || ""}
            onChange={(e) => onChange("duration_months", parseInt(e.target.value) || 0)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price_inr">Price (INR)</Label>
          <Input
            id="price_inr"
            type="number"
            value={formData.price_inr || ""}
            onChange={(e) => onChange("price_inr", parseInt(e.target.value) || 0)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="original_price_inr">Original Price (INR)</Label>
          <Input
            id="original_price_inr"
            type="number"
            value={formData.original_price_inr || ""}
            onChange={(e) => onChange("original_price_inr", parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>What You'll Learn</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setAIType("what_you_learn");
              setIsAIDialogOpen(true);
            }}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Generate with AI
          </Button>
        </div>
        <div className="space-y-2">
          {(formData.what_you_learn || []).map((item: string, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <Input value={item} readOnly className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeLearnItem(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newLearnItem}
              onChange={(e) => setNewLearnItem(e.target.value)}
              placeholder="Add learning point"
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLearnItem())}
            />
            <Button type="button" onClick={addLearnItem} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>This Course Includes</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setAIType("course_includes");
              setIsAIDialogOpen(true);
            }}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Generate with AI
          </Button>
        </div>
        <div className="space-y-2">
          {(formData.course_includes || []).map((item: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <Input value={`${item.icon}: ${item.text}`} readOnly className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeIncludeItem(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newIncludeItem.icon}
              onChange={(e) => setNewIncludeItem({ ...newIncludeItem, icon: e.target.value })}
              placeholder="Icon"
              className="w-32"
            />
            <Input
              value={newIncludeItem.text}
              onChange={(e) => setNewIncludeItem({ ...newIncludeItem, text: e.target.value })}
              placeholder="Feature description"
              className="flex-1"
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addIncludeItem())}
            />
            <Button type="button" onClick={addIncludeItem} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active ?? true}
          onCheckedChange={(checked) => onChange("is_active", checked)}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>

      <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Content with AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {aiType === "short" && "Generate a short description for your course"}
              {aiType === "detailed" && "Generate a detailed description based on the short description"}
              {aiType === "what_you_learn" && "Generate learning outcomes for your course"}
              {aiType === "course_includes" && "Generate course features and inclusions"}
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleAIGenerate} 
                disabled={generateContent.isPending}
                className="flex-1"
              >
                {generateContent.isPending ? "Generating..." : "Generate"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAIDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};