import { ConversationState } from "@/hooks/useSalesAssistant";
import { AudioWaveform } from "./AudioWaveform";
import { CounselorAvatar } from "./CounselorAvatar";

interface VoiceStatusIndicatorProps {
  state: ConversationState;
  gender: "female" | "male";
  avatarUrl?: string;
  onTap?: () => void;
  isGenerating?: boolean;
}

export const VoiceStatusIndicator = ({ 
  state, 
  gender, 
  avatarUrl, 
  onTap,
  isGenerating 
}: VoiceStatusIndicatorProps) => {
  const getStateConfig = () => {
    switch (state) {
      case "listening":
        return { text: "Listening...", pulse: true };
      case "speaking":
        return { text: "Speaking...", pulse: true };
      case "processing":
        return { text: "Processing...", pulse: false };
      default:
        return { text: "Tap to start", pulse: false };
    }
  };

  const config = getStateConfig();

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Counselor Avatar */}
      <CounselorAvatar
        gender={gender}
        conversationState={state}
        avatarUrl={avatarUrl}
        onTap={onTap}
        isGenerating={isGenerating}
      />

      {/* Audio Waveform */}
      <AudioWaveform isActive={state === "speaking"} color={state === "speaking" ? "bg-blue-500" : "bg-muted"} />

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
