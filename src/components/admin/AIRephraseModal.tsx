import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X, Loader2 } from "lucide-react";
import { useAIRephrase, RephraseType } from "@/hooks/useAIRephrase";
import { Card } from "@/components/ui/card";

interface AIRephraseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalText: string;
  type: RephraseType;
  onAccept: (rephrasedText: string) => void;
}

export const AIRephraseModal = ({
  open,
  onOpenChange,
  originalText,
  type,
  onAccept,
}: AIRephraseModalProps) => {
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const rephraseMutation = useAIRephrase();

  const handleRephrase = () => {
    rephraseMutation.mutate({ text: originalText, type });
  };

  const handleAccept = () => {
    if (selectedSuggestion) {
      onAccept(selectedSuggestion);
      onOpenChange(false);
      setSelectedSuggestion(null);
    }
  };

  const rephrasedText = rephraseMutation.data?.rephrased;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Rephrase - {type.charAt(0).toUpperCase() + type.slice(1)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Original Text</h4>
            <Card className="p-3 bg-muted">
              <p className="text-sm">{originalText}</p>
            </Card>
          </div>

          {!rephrasedText && !rephraseMutation.isPending && (
            <Button onClick={handleRephrase} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Rephrased Version
            </Button>
          )}

          {rephraseMutation.isPending && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">AI is rephrasing...</span>
            </div>
          )}

          {rephrasedText && (
            <div>
              <h4 className="text-sm font-medium mb-2">Rephrased Suggestion</h4>
              <Card
                className={`p-3 cursor-pointer transition-colors ${
                  selectedSuggestion === rephrasedText
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedSuggestion(rephrasedText)}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm flex-1">{rephrasedText}</p>
                  {selectedSuggestion === rephrasedText && (
                    <Check className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                  )}
                </div>
              </Card>
            </div>
          )}

          {rephraseMutation.isError && (
            <Card className="p-3 bg-destructive/10 border-destructive">
              <p className="text-sm text-destructive">
                Failed to rephrase. Please try again.
              </p>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!selectedSuggestion}
          >
            <Check className="h-4 w-4 mr-2" />
            Accept Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
