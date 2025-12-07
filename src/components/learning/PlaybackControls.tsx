import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Maximize, Minimize, Languages, Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

interface PlaybackControlsProps {
  isPaused: boolean;
  onPlayPause: () => void;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  currentSlide: number;
  totalSlides: number;
  isMuted: boolean;
  onMuteToggle: () => void;
  isFullScreen: boolean;
  onFullScreenToggle: () => void;
  isMinimized: boolean;
  onMinimizeToggle: () => void;
  language: 'en-IN' | 'hi-IN' | 'kn-IN' | 'ta-IN' | 'te-IN' | 'ml-IN';
  onLanguageChange: (lang: 'en-IN' | 'hi-IN' | 'kn-IN' | 'ta-IN' | 'te-IN' | 'ml-IN') => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  progress: number; // 0-100
  onSeek: (progress: number) => void;
  currentTime: string;
  totalTime: string;
}

const languages = [
  { code: 'en-IN', label: 'English', flag: '🇬🇧' },
  { code: 'hi-IN', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ta-IN', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te-IN', label: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ml-IN', label: 'മലയാളം', flag: '🇮🇳' },
] as const;

const speeds = [0.5, 0.75, 1, 1.25, 1.5];

export function PlaybackControls({
  isPaused,
  onPlayPause,
  onPrevSlide,
  onNextSlide,
  currentSlide,
  totalSlides,
  isMuted,
  onMuteToggle,
  isFullScreen,
  onFullScreenToggle,
  isMinimized,
  onMinimizeToggle,
  language,
  onLanguageChange,
  playbackSpeed,
  onSpeedChange,
  progress,
  onSeek,
  currentTime,
  totalTime,
}: PlaybackControlsProps) {
  return (
    <div className="bg-background/95 backdrop-blur-md border-t px-4 py-2">
      {/* Progress Bar */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs text-muted-foreground w-12 text-right font-mono">
          {currentTime}
        </span>
        <Slider
          value={[progress]}
          onValueChange={(v) => onSeek(v[0])}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-12 font-mono">
          {totalTime}
        </span>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Left: Playback controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevSlide}
            disabled={currentSlide === 0}
            className="h-8 w-8 p-0"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onPlayPause}
            className="h-10 w-10 p-0 rounded-full bg-primary/10 hover:bg-primary/20"
          >
            {isPaused ? (
              <Play className="h-5 w-5 text-primary" />
            ) : (
              <Pause className="h-5 w-5 text-primary" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onNextSlide}
            disabled={currentSlide === totalSlides - 1}
            className="h-8 w-8 p-0"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          
          <span className="text-xs text-muted-foreground ml-2 tabular-nums">
            {currentSlide + 1} / {totalSlides}
          </span>
        </div>
        
        {/* Center: Empty for balance */}
        <div className="flex-1" />
        
        {/* Right: Settings */}
        <div className="flex items-center gap-1">
          {/* Mute */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMuteToggle}
            className="h-8 w-8 p-0"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          
          {/* Speed */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                {playbackSpeed}x
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {speeds.map((speed) => (
                <DropdownMenuItem
                  key={speed}
                  onClick={() => onSpeedChange(speed)}
                  className={cn(speed === playbackSpeed && "bg-primary/10")}
                >
                  {speed}x
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Language */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Languages className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => onLanguageChange(lang.code as any)}
                  className={cn(lang.code === language && "bg-primary/10")}
                >
                  <span className="mr-2">{lang.flag}</span>
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Minimize */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMinimizeToggle}
            className="h-8 w-8 p-0"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            <Minimize className="h-4 w-4" />
          </Button>
          
          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onFullScreenToggle}
            className="h-8 w-8 p-0"
            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
