import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Download } from "lucide-react";
import { getPodcastsByTopic } from "@/data/mockLearning";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface PodcastPlayerProps {
  topicId: string;
}

export const PodcastPlayer = ({ topicId }: PodcastPlayerProps) => {
  const podcasts = getPodcastsByTopic(topicId);
  const [selectedPodcast, setSelectedPodcast] = useState(podcasts[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (podcasts.length > 0) {
      setSelectedPodcast(podcasts[0]);
    }
  }, [topicId]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const changePlaybackRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!selectedPodcast) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No podcasts available for this topic.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{selectedPodcast.title}</span>
            <Badge variant="secondary">{selectedPodcast.duration}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          >
            <source src={selectedPodcast.audioUrl} type="audio/mpeg" />
          </audio>

          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" onClick={() => skipTime(-10)}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={togglePlay} className="h-12 w-12">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button variant="outline" size="icon" onClick={() => skipTime(10)}>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={changePlaybackRate}>
              Speed: {playbackRate}x
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {selectedPodcast.transcript}
            </p>
          </ScrollArea>
        </CardContent>
      </Card>

      {podcasts.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>More Podcasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {podcasts.map((podcast) => (
                <Button
                  key={podcast.id}
                  variant={selectedPodcast.id === podcast.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedPodcast(podcast)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  <span className="flex-1 text-left">{podcast.title}</span>
                  <span className="text-muted-foreground">{podcast.duration}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
