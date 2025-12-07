import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, CheckCircle, Clock, Video } from "lucide-react";
import { useTopicVideos, INDIAN_LANGUAGES, TopicVideo } from "@/hooks/useTopicVideos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RecordedVideosProps {
  topicId: string;
}

export const RecordedVideos = ({ topicId }: RecordedVideosProps) => {
  const { data: videos, isLoading } = useTopicVideos(topicId);
  const [selectedVideo, setSelectedVideo] = useState<TopicVideo | null>(null);
  const [filterLanguage, setFilterLanguage] = useState<string>("all");

  // Get unique languages from videos
  const availableLanguages = videos 
    ? [...new Set(videos.map(v => v.language))]
    : [];

  const filteredVideos = filterLanguage === "all" 
    ? videos || []
    : (videos || []).filter(v => v.language === filterLanguage);

  // Get embed URL based on platform
  const getEmbedUrl = (video: TopicVideo) => {
    if (video.video_platform === "youtube") {
      return `https://www.youtube.com/embed/${video.video_id}?autoplay=1`;
    } else if (video.video_platform === "vimeo") {
      return `https://player.vimeo.com/video/${video.video_id}?autoplay=1`;
    }
    return "";
  };

  // Get language label
  const getLanguageLabel = (langValue: string) => {
    const lang = INDIAN_LANGUAGES.find(l => l.value === langValue);
    return lang?.label || langValue;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Videos Available</h3>
            <p className="text-muted-foreground">
              Videos for this topic will be added soon.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Language Filter */}
      {availableLanguages.length > 1 && (
        <div className="flex items-center gap-2">
          <Select value={filterLanguage} onValueChange={setFilterLanguage}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {availableLanguages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {getLanguageLabel(lang)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Video Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVideos.map((video) => (
          <Card
            key={video.id}
            className="cursor-pointer hover:border-primary transition-colors overflow-hidden"
            onClick={() => setSelectedVideo(video)}
          >
            <CardHeader className="p-0">
              <div className="relative aspect-video bg-muted overflow-hidden">
                {/* Thumbnail based on platform */}
                {video.video_platform === "youtube" ? (
                  <img
                    src={`https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`}
                    alt={video.video_name}
                    className="w-full h-full object-cover"
                  />
                ) : video.video_platform === "vimeo" ? (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Video className="h-12 w-12 text-primary/50" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="bg-primary rounded-full p-4">
                    <Play className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>

                {/* Platform badge */}
                <Badge 
                  variant="secondary" 
                  className="absolute top-2 left-2 capitalize"
                >
                  {video.video_platform}
                </Badge>

                {/* Language badge */}
                <Badge 
                  className="absolute top-2 right-2 bg-primary/90"
                >
                  {getLanguageLabel(video.language)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-1 line-clamp-2">{video.video_name}</h3>
              {video.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {video.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Video Player Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{selectedVideo?.video_name}</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4 p-4 pt-2">
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  src={getEmbedUrl(selectedVideo)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {selectedVideo.video_platform}
                  </Badge>
                  <Badge>
                    {getLanguageLabel(selectedVideo.language)}
                  </Badge>
                </div>
                <Button variant="outline" onClick={() => setSelectedVideo(null)}>
                  Close
                </Button>
              </div>

              {selectedVideo.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedVideo.description}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
