import { ConversationState } from "@/hooks/useSalesAssistant";
import { Loader2 } from "lucide-react";

interface CounselorAvatarProps {
  gender: "female" | "male";
  conversationState: ConversationState;
  avatarUrl?: string;
  onTap?: () => void;
}

export const CounselorAvatar = ({ 
  gender, 
  conversationState, 
  avatarUrl,
  onTap 
}: CounselorAvatarProps) => {
  const getAvatarClass = () => {
    switch (conversationState) {
      case "listening":
        return "avatar-listening";
      case "speaking":
        return "avatar-speaking";
      case "processing":
        return "avatar-processing";
      default:
        return "";
    }
  };

  const counselorName = gender === "male" ? "Rahul" : "Priya";

  return (
    <div
      onClick={onTap}
      className="flex flex-col items-center justify-center gap-4 cursor-pointer"
    >
      {/* Avatar Container */}
      <div className="relative">
        {/* Speaking indicator ring */}
        {conversationState === "speaking" && (
          <div className="absolute -inset-2">
            <div 
              className="absolute inset-0 rounded-full border-4 border-primary/50"
              style={{
                animation: 'speak-ripple 1.5s ease-out infinite'
              }}
            />
            <div 
              className="absolute inset-0 rounded-full border-2 border-primary"
              style={{
                animation: 'speak-ripple 1.5s ease-out infinite 0.75s'
              }}
            />
          </div>
        )}

        <div
          className={`w-40 h-40 rounded-full overflow-hidden border-4 border-border shadow-2xl transition-all duration-300 ${getAvatarClass()}`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${counselorName} - Educational Counselor`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <div className="text-6xl">
                {gender === "male" ? "👨‍💼" : "👩‍💼"}
              </div>
            </div>
          )}
        </div>

        {/* Processing overlay */}
        {conversationState === "processing" && (
          <div className="absolute inset-0 rounded-full bg-background/80 flex items-center justify-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
        )}
      </div>

      {/* Counselor Name Badge */}
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">{counselorName}</p>
        <p className="text-sm text-muted-foreground">Educational Counselor</p>
      </div>
    </div>
  );
};
