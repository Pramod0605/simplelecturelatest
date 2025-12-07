import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { User, Volume2, VolumeX } from 'lucide-react';

interface FloatingAvatarProps {
  isSpeaking: boolean;
  isProcessing: boolean;
  language: 'en-IN' | 'hi-IN' | 'kn-IN' | 'ta-IN' | 'te-IN' | 'ml-IN';
  onMuteToggle?: () => void;
  isMuted?: boolean;
}

export function FloatingAvatar({ 
  isSpeaking, 
  isProcessing,
  language,
  onMuteToggle,
  isMuted = false
}: FloatingAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const gender = language === 'hi-IN' ? 'female' : 'male';
        const { data } = await supabase
          .from('counselor_avatars')
          .select('image_url')
          .eq('gender', gender)
          .eq('is_active', true)
          .order('display_order')
          .limit(1)
          .maybeSingle();

        if (data) setAvatarUrl(data.image_url);
      } catch (error) {
        console.error('Error fetching avatar:', error);
      }
    };
    fetchAvatar();
  }, [language]);

  return (
    <div className="absolute bottom-4 left-4 z-30 flex items-end gap-2">
      {/* Avatar with audio ring */}
      <div 
        className={cn(
          "relative w-16 h-16 rounded-full overflow-hidden cursor-pointer transition-all duration-300 shadow-lg",
          "border-2",
          isSpeaking && "border-primary animate-pulse shadow-primary/40 shadow-lg",
          isProcessing && "border-yellow-500 shadow-yellow-500/40",
          !isSpeaking && !isProcessing && "border-muted hover:scale-110"
        )}
        onClick={onMuteToggle}
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Professor"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        
        {/* Audio ring when speaking */}
        {isSpeaking && (
          <>
            <div className="absolute inset-0 border-2 border-primary rounded-full animate-ping opacity-30" />
            <div className="absolute -inset-1 border border-primary/50 rounded-full animate-pulse" />
          </>
        )}
        
        {/* Mute indicator */}
        {isMuted && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <VolumeX className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
      
      {/* Waveform bars when speaking */}
      {isSpeaking && !isMuted && (
        <div className="flex items-end gap-0.5 h-8 pb-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 60 + 40}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${0.3 + Math.random() * 0.3}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
