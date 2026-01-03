import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Video, Sparkles } from "lucide-react";
import { useTopicVideos, INDIAN_LANGUAGES, TopicVideo } from "@/hooks/useTopicVideos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface RecordedVideosProps {
  topicId?: string;
  chapterId?: string;
  // Direct video from subject_topics table
  topicVideoId?: string;
  topicVideoPlatform?: string;
  topicTitle?: string;
  // AI Generated lecture video URL
  aiGeneratedVideoUrl?: string;
}

export const RecordedVideos = ({ topicId, chapterId, topicVideoId, topicVideoPlatform, topicTitle, aiGeneratedVideoUrl }: RecordedVideosProps) => {
  const { data: additionalVideos, isLoading } = useTopicVideos(topicId);
  const [selectedVideo, setSelectedVideo] = useState<TopicVideo | null>(null);
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [showAIVideo, setShowAIVideo] = useState(false);

  // Combine the direct topic video with additional videos from topic_videos table
  const allVideos = useMemo(() => {
    const videos: TopicVideo[] = [];
    
    // Add direct video from subject_topics if exists
    if (topicVideoId && topicVideoPlatform) {
      videos.push({
        id: `topic-direct-${topicId}`,
        topic_id: topicId,
        video_name: topicTitle || "Topic Video",
        language: "en",
        video_platform: topicVideoPlatform as "youtube" | "vimeo",
        video_id: topicVideoId,
        description: null,
        display_order: 0,
        is_active: true,
        created_at: null,
        updated_at: null,
      });
    }
    
    // Add additional videos from topic_videos table
    if (additionalVideos?.length) {
      videos.push(...additionalVideos);
    }
    
    return videos;
  }, [topicId, topicVideoId, topicVideoPlatform, topicTitle, additionalVideos]);

  // Get unique languages from videos
  const availableLanguages = [...new Set(allVideos.map(v => v.language))];

  const filteredVideos = filterLanguage === "all" 
    ? allVideos
    : allVideos.filter(v => v.language === filterLanguage);

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

  if (isLoading && !topicVideoId) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (allVideos.length === 0 && !aiGeneratedVideoUrl) {
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
      {/* Language Tabs */}
      {allVideos.length > 0 && (
        <Tabs value={filterLanguage} onValueChange={setFilterLanguage} className="w-full">
          <TabsList className="h-auto flex-wrap gap-1">
            <TabsTrigger value="all" className="text-xs px-3 py-1.5">
              All ({allVideos.length})
            </TabsTrigger>
            {availableLanguages.map((lang) => {
              const langLabel = getLanguageLabel(lang);
              const count = allVideos.filter(v => v.language === lang).length;
              return (
                <TabsTrigger key={lang} value={lang} className="text-xs px-3 py-1.5">
                  {langLabel} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      )}

      {/* Video Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* AI Generated Lecture Video - First in grid */}
        {aiGeneratedVideoUrl && (
          <Card
            className="cursor-pointer hover:border-violet-500 transition-colors overflow-hidden border-violet-200 dark:border-violet-800"
            onClick={() => setShowAIVideo(true)}
          >
            <CardHeader className="p-0">
              <div className="relative aspect-video bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="h-16 w-16 mx-auto text-violet-500 mb-2" />
                  <p className="text-lg font-semibold text-violet-700 dark:text-violet-300">
                    AI Generated Lecture
                  </p>
                </div>
                
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="bg-violet-500 rounded-full p-4">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                </div>

                {/* Badge */}
                <Badge className="absolute top-2 left-2 bg-violet-500 hover:bg-violet-600">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Lecture
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <h3 className="font-semibold">{topicTitle} - AI Generated Lecture</h3>
              <p className="text-sm text-muted-foreground">
                Watch the AI-generated video lecture with embedded player
              </p>
            </CardContent>
          </Card>
        )}

        {/* Regular Videos */}
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

      {/* AI Generated Video Dialog */}
      <Dialog open={showAIVideo} onOpenChange={setShowAIVideo}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{topicTitle} - AI Generated Lecture</DialogTitle>
          </DialogHeader>
          {aiGeneratedVideoUrl && (
            <div className="space-y-4 p-4 pt-2">
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  src={aiGeneratedVideoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              </div>
              <div className="flex items-center justify-between">
                <Badge className="bg-violet-500">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Generated
                </Badge>
                <Button variant="outline" onClick={() => setShowAIVideo(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
