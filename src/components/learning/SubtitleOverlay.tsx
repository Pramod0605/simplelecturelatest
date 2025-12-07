import { cn } from '@/lib/utils';

interface SubtitleOverlayProps {
  text: string;
  isVisible: boolean;
  language: 'en-IN' | 'hi-IN';
}

export function SubtitleOverlay({ text, isVisible, language }: SubtitleOverlayProps) {
  if (!isVisible || !text) return null;

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 max-w-3xl w-full px-4">
      <div className={cn(
        "bg-black/80 text-white px-6 py-3 rounded-lg text-center shadow-lg backdrop-blur-sm",
        "animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
      )}>
        <p className={cn(
          "text-lg leading-relaxed",
          language === 'hi-IN' && "font-hindi"
        )}>
          {text}
        </p>
      </div>
    </div>
  );
}
