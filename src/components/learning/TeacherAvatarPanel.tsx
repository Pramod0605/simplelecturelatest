import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { AudioWaveform } from '@/components/SalesAssistant/AudioWaveform';
import { Volume2, VolumeX, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TeacherAvatarPanelProps {
  isSpeaking: boolean;
  isProcessing: boolean;
  language: 'en-IN' | 'hi-IN' | 'kn-IN' | 'ta-IN' | 'te-IN' | 'ml-IN';
  onMuteToggle?: () => void;
  isMuted?: boolean;
  subjectName?: string;
}

export function TeacherAvatarPanel({ 
  isSpeaking, 
  isProcessing,
  language,
  onMuteToggle,
  isMuted = false,
  subjectName
}: TeacherAvatarPanelProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarName, setAvatarName] = useState<string>('Professor');

  // Fetch teacher avatar from counselor_avatars
  useEffect(() => {
    const fetchAvatar = async () => {
      try {
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

  const professorTitle = subjectName 
    ? `${subjectName} AI Professor` 
    : language === 'hi-IN' ? 'AI प्रोफेसर' : 'AI Professor';

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-primary/5 to-primary/10 rounded-lg p-4">
      {/* Avatar Container */}
      <div className={cn(
        "relative w-32 h-32 rounded-full overflow-hidden border-4 transition-all duration-300",
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
            <User className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        
        {isSpeaking && (
          <div className="absolute inset-0 border-4 border-primary rounded-full animate-pulse" />
        )}
        
        {isProcessing && (
          <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Teacher Info */}
      <h3 className="mt-3 text-sm font-semibold text-foreground text-center">
        {avatarName}
      </h3>
      <p className="text-xs text-muted-foreground text-center">
        {professorTitle}
      </p>

      {/* Audio Waveform */}
      <div className="mt-4 w-full max-w-[150px]">
        {isSpeaking ? (
          <AudioWaveform isActive={true} />
        ) : (
          <div className="h-6 flex items-center justify-center">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
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
          size="sm"
          className="mt-3"
          onClick={onMuteToggle}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Status Text */}
      <p className="mt-2 text-xs text-muted-foreground text-center">
        {isProcessing ? 'Thinking...' : isSpeaking ? 'Speaking...' : 'Ready'}
      </p>
    </div>
  );
}