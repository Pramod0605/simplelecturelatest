import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { AudioWaveform } from '@/components/SalesAssistant/AudioWaveform';
import { Volume2, VolumeX, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TeacherAvatarPanelProps {
  isSpeaking: boolean;
  isProcessing: boolean;
  language: 'en-IN' | 'hi-IN';
  onMuteToggle?: () => void;
  isMuted?: boolean;
}

export function TeacherAvatarPanel({ 
  isSpeaking, 
  isProcessing,
  language,
  onMuteToggle,
  isMuted = false
}: TeacherAvatarPanelProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarName, setAvatarName] = useState<string>('Teacher');

  // Fetch teacher avatar from counselor_avatars or use default
  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        // Get a male avatar for English, female for Hindi (matching existing pattern)
        const gender = language === 'hi-IN' ? 'female' : 'male';
        
        const { data } = await supabase
          .from('counselor_avatars')
          .select('*')
          .eq('gender', gender)
          .eq('is_active', true)
          .order('display_order')
          .limit(1)
          .maybeSingle();

        if (data) {
          setAvatarUrl(data.image_url);
          setAvatarName(data.name);
        }
      } catch (error) {
        console.error('Error fetching avatar:', error);
      }
    };

    fetchAvatar();
  }, [language]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-primary/5 to-primary/10 rounded-lg p-6">
      {/* Avatar Container */}
      <div className={cn(
        "relative w-48 h-48 rounded-full overflow-hidden border-4 transition-all duration-300",
        isSpeaking && "border-primary shadow-lg shadow-primary/30 scale-105",
        isProcessing && "border-yellow-500 shadow-lg shadow-yellow-500/30",
        !isSpeaking && !isProcessing && "border-muted"
      )}>
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={avatarName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <User className="w-24 h-24 text-muted-foreground" />
          </div>
        )}
        
        {/* Speaking indicator ring */}
        {isSpeaking && (
          <div className="absolute inset-0 border-4 border-primary rounded-full animate-pulse" />
        )}
        
        {/* Processing indicator */}
        {isProcessing && (
          <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Teacher Name */}
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        {avatarName}
      </h3>
      <p className="text-sm text-muted-foreground">
        {language === 'hi-IN' ? 'हिंदी शिक्षक' : 'English Teacher'}
      </p>

      {/* Audio Waveform when speaking */}
      <div className="mt-6 w-full max-w-[200px]">
        {isSpeaking ? (
          <AudioWaveform isActive={true} />
        ) : (
          <div className="h-8 flex items-center justify-center">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div 
                  key={i} 
                  className="w-1 h-2 bg-muted-foreground/30 rounded-full"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mute Button */}
      {onMuteToggle && (
        <Button
          variant="ghost"
          size="icon"
          className="mt-4"
          onClick={onMuteToggle}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </Button>
      )}

      {/* Status Text */}
      <p className="mt-4 text-xs text-muted-foreground text-center">
        {isProcessing ? 'Thinking...' : isSpeaking ? 'Speaking...' : 'Ready to help'}
      </p>
    </div>
  );
}
