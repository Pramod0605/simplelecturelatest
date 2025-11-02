import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { RichContentEditor } from "./RichContentEditor";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface QuestionTabContentProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  chapters: any[];
  topics: any[];
  onAIRephrase?: () => void;
  isRephrasing?: boolean;
}

export const QuestionTabContent: React.FC<QuestionTabContentProps> = ({
  formData,
  onChange,
  chapters,
  topics,
  onAIRephrase,
  isRephrasing,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Chapter</Label>
          <Select value={formData.chapter_id} onValueChange={(value) => onChange('chapter_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select chapter" />
            </SelectTrigger>
            <SelectContent>
              {chapters?.map((chapter) => (
                <SelectItem key={chapter.id} value={chapter.id}>
                  {chapter.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Topic</Label>
          <Select 
            value={formData.topic_id} 
            onValueChange={(value) => onChange('topic_id', value)}
            disabled={!formData.chapter_id}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select topic" />
            </SelectTrigger>
            <SelectContent>
              {topics?.map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>
                  {topic.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Question Format</Label>
        <RadioGroup
          value={formData.question_format}
          onValueChange={(value) => onChange('question_format', value)}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="single_choice" id="single" />
            <Label htmlFor="single" className="font-normal cursor-pointer">Single Choice</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="multiple_choice" id="multiple" />
            <Label htmlFor="multiple" className="font-normal cursor-pointer">Multiple Choice</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true_false" id="tf" />
            <Label htmlFor="tf" className="font-normal cursor-pointer">True/False</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="fill_blank" id="fill" />
            <Label htmlFor="fill" className="font-normal cursor-pointer">Fill in the Blank</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="short_answer" id="short" />
            <Label htmlFor="short" className="font-normal cursor-pointer">Short Answer</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="contains_formula"
          checked={formData.contains_formula}
          onCheckedChange={(checked) => onChange('contains_formula', checked)}
        />
        <Label htmlFor="contains_formula" className="font-normal cursor-pointer">
          This question contains formulas (Math/Chemistry/Accounting)
        </Label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Question Text</Label>
          {onAIRephrase && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAIRephrase}
              disabled={isRephrasing || !formData.question_text}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isRephrasing ? 'Rephrasing...' : 'AI Rephrase'}
            </Button>
          )}
        </div>
        <RichContentEditor
          value={formData.question_text}
          onChange={(value) => onChange('question_text', value)}
          onImagesChange={(images) => onChange('question_images', images)}
          placeholder="Enter your question here... You can paste images directly!"
          showFormulaSupport={formData.contains_formula}
          allowImagePaste={true}
          questionId={formData.id || 'new'}
          imageType="question"
          currentImages={formData.question_images || []}
        />
      </div>
    </div>
  );
};
