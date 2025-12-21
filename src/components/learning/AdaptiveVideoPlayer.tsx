import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Wifi,
  WifiOff,
  RotateCcw,
  SkipBack,
  SkipForward,
  Download,
  Loader2,
} from 'lucide-react';
import { useNetworkQuality } from '@/hooks/useNetworkQuality';
import { useRecordingPlaybackUrl, useUpdateWatchProgress, useVideoWatchProgress } from '@/hooks/useClassRecordings';
import { cn } from '@/lib/utils';

interface AdaptiveVideoPlayerProps {
  recordingId: string;
  title: string;
  onProgress?: (seconds: number, percent: number) => void;
  onComplete?: () => void;
  onQualityChange?: (quality: string) => void;
  initialPosition?: number;
  autoPlay?: boolean;
  showDownloadButton?: boolean;
  onDownloadRequest?: () => void;
}

export const AdaptiveVideoPlayer = ({
  recordingId,
  title,
  onProgress,
  onComplete,
  onQualityChange,
  initialPosition = 0,
  autoPlay = false,
  showDownloadButton = false,
  onDownloadRequest,
}: AdaptiveVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');
  const [currentQuality, setCurrentQuality] = useState<string>('720p');
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const networkQuality = useNetworkQuality();
  const getPlaybackUrl = useRecordingPlaybackUrl();
  const updateProgress = useUpdateWatchProgress();
  const { data: savedProgress } = useVideoWatchProgress(recordingId);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const progressUpdateRef = useRef<NodeJS.Timeout>();

  // Load HLS.js dynamically
  useEffect(() => {
    const loadHls = async () => {
      try {
        const { default: Hls } = await import('hls.js');
        
        const playbackData = await getPlaybackUrl.mutateAsync({
          recordingId,
          quality: networkQuality.recommendedQuality,
        });
        
        setHlsUrl(playbackData.hlsUrl);
        setAvailableQualities(playbackData.availableQualities || ['360p', '480p', '720p', '1080p']);
        setCurrentQuality(playbackData.quality);
        
        if (videoRef.current && Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 30,
            maxBufferLength: 60,
            maxMaxBufferLength: 120,
            startLevel: -1, // Auto quality
          });
          
          hls.loadSource(playbackData.hlsUrl);
          hls.attachMedia(videoRef.current);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (autoPlay) {
              videoRef.current?.play();
            }
            // Set initial position from saved progress
            const startPosition = savedProgress?.progress_seconds || initialPosition;
            if (startPosition > 0 && videoRef.current) {
              videoRef.current.currentTime = startPosition;
            }
          });
          
          hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
            const qualities = ['360p', '480p', '720p', '1080p'];
            const newQuality = qualities[data.level] || 'auto';
            setCurrentQuality(newQuality);
            onQualityChange?.(newQuality);
          });
          
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              console.error('HLS error:', data);
              setError('Failed to load video. Please try again.');
            }
          });
          
          hlsRef.current = hls;
        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          videoRef.current.src = playbackData.hlsUrl;
        }
      } catch (err) {
        console.error('Failed to load video:', err);
        setError('Failed to load video. Please try again.');
      }
    };
    
    loadHls();
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [recordingId]);

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };
    
    const container = containerRef.current;
    container?.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      container?.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Save progress periodically
  useEffect(() => {
    if (isPlaying && duration > 0) {
      progressUpdateRef.current = setInterval(() => {
        const percent = (currentTime / duration) * 100;
        updateProgress.mutate({
          recordingId,
          progressSeconds: Math.floor(currentTime),
          progressPercent: percent,
          completed: percent >= 95,
        });
        onProgress?.(currentTime, percent);
      }, 10000); // Every 10 seconds
    }
    
    return () => {
      if (progressUpdateRef.current) {
        clearInterval(progressUpdateRef.current);
      }
    };
  }, [isPlaying, currentTime, duration, recordingId]);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  }, []);

  const handleSeek = useCallback((value: number[]) => {
    const newTime = value[0];
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  }, []);

  const handleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  const handleQualityChange = useCallback((quality: string) => {
    setSelectedQuality(quality);
    
    if (hlsRef.current) {
      if (quality === 'auto') {
        hlsRef.current.currentLevel = -1;
      } else {
        const qualityIndex = availableQualities.indexOf(quality);
        if (qualityIndex !== -1) {
          hlsRef.current.currentLevel = qualityIndex;
        }
      }
    }
  }, [availableQualities]);

  const skipForward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
    }
  }, [duration]);

  const skipBackward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <Card className="aspect-video bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <WifiOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (getPlaybackUrl.isPending || !hlsUrl) {
    return (
      <Card className="aspect-video">
        <Skeleton className="w-full h-full" />
      </Card>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative aspect-video bg-black rounded-lg overflow-hidden group",
        isFullscreen && "fixed inset-0 z-50 rounded-none"
      )}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onEnded={() => {
          onComplete?.();
          updateProgress.mutate({
            recordingId,
            progressSeconds: Math.floor(duration),
            progressPercent: 100,
            completed: true,
          });
        }}
      />
      
      {/* Buffering indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-12 w-12 text-white animate-spin" />
        </div>
      )}
      
      {/* Controls overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <h3 className="text-white font-medium truncate">{title}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-black/50 text-white">
              <Wifi className="h-3 w-3 mr-1" />
              {networkQuality.connectionType}
            </Badge>
            <Badge variant="secondary" className="bg-black/50 text-white">
              {currentQuality}
            </Badge>
          </div>
        </div>
        
        {/* Center play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-16 w-16 rounded-full bg-white/20 hover:bg-white/30 text-white"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8 ml-1" />
            )}
          </Button>
        </div>
        
        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Progress bar */}
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          
          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={handlePlayPause}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={skipBackward}
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={skipForward}
              >
                <SkipForward className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-2 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => {
                    setIsMuted(!isMuted);
                    if (videoRef.current) {
                      videoRef.current.muted = !isMuted;
                    }
                  }}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
              
              <span className="text-white text-sm ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {showDownloadButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={onDownloadRequest}
                >
                  <Download className="h-5 w-5" />
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background">
                  <DropdownMenuItem
                    onClick={() => handleQualityChange('auto')}
                    className={selectedQuality === 'auto' ? 'bg-accent' : ''}
                  >
                    Auto ({networkQuality.recommendedQuality})
                  </DropdownMenuItem>
                  {availableQualities.map((q) => (
                    <DropdownMenuItem
                      key={q}
                      onClick={() => handleQualityChange(q)}
                      className={selectedQuality === q ? 'bg-accent' : ''}
                    >
                      {q}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={handleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
