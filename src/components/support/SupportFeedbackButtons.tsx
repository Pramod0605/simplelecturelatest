import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowUpCircle } from "lucide-react";

interface SupportFeedbackButtonsProps {
  onResolve: () => void;
  onEscalate: () => void;
}

export const SupportFeedbackButtons = ({ onResolve, onEscalate }: SupportFeedbackButtonsProps) => {
  return (
    <div className="bg-muted/50 rounded-lg p-4 border">
      <p className="text-sm text-muted-foreground mb-3 text-center">
        Did this resolve your issue?
      </p>
      <div className="flex gap-3 justify-center">
        <Button 
          variant="outline" 
          onClick={onResolve}
          className="gap-2 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
        >
          <CheckCircle className="h-4 w-4" />
          Yes, Resolved
        </Button>
        <Button 
          variant="outline" 
          onClick={onEscalate}
          className="gap-2 text-orange-600 border-orange-600 hover:bg-orange-50 hover:text-orange-700"
        >
          <ArrowUpCircle className="h-4 w-4" />
          Need Human Support
        </Button>
      </div>
    </div>
  );
};
