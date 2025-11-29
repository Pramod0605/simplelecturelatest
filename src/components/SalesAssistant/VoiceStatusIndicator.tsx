import { ConversationState } from "@/hooks/useSalesAssistant";
import { Mic, Volume2, Loader2 } from "lucide-react";

interface VoiceStatusIndicatorProps {
  state: ConversationState;
  onTap?: () => void;
}

export const VoiceStatusIndicator = ({ state, onTap }: VoiceStatusIndicatorProps) => {
  const getStateConfig = () => {
    switch (state) {
      case "listening":
        return {
          icon: Mic,
          color: "bg-green-500",
          text: "Listening...",
          pulse: true,
        };
      case "speaking":
        return {
          icon: Volume2,
          color: "bg-blue-500",
          text: "Speaking...",
          pulse: true,
        };
      case "processing":
        return {
          icon: Loader2,
          color: "bg-yellow-500",
          text: "Processing...",
          pulse: false,
        };
      default:
        return {
          icon: Mic,
          color: "bg-muted",
          text: "Tap to start",
          pulse: false,
        };
    }
  };

  const config = getStateConfig();
  const Icon = config.icon;

  return (
    <div
      onClick={onTap}
      className={`flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
        config.pulse ? "animate-pulse" : ""
      }`}
    >
      {/* Animated Orb */}
      <div className="relative">
        <div
          className={`w-32 h-32 rounded-full ${config.color} flex items-center justify-center shadow-2xl transition-all duration-300`}
        >
          <Icon className="h-16 w-16 text-white" />
        </div>
        
        {/* Ripple effect for active states */}
        {config.pulse && (
          <>
            <div className={`absolute inset-0 rounded-full ${config.color} opacity-20 animate-ping`} />
            <div
              className={`absolute inset-0 rounded-full ${config.color} opacity-30 animate-pulse`}
              style={{ animationDuration: "2s" }}
            />
          </>
        )}
      </div>

      {/* Status Text */}
      <p className="text-lg font-medium text-foreground">{config.text}</p>
      
      {/* Hint for interruption */}
      {state === "speaking" && (
        <p className="text-sm text-muted-foreground animate-bounce">
          Tap to interrupt
        </p>
      )}
    </div>
  );
};
