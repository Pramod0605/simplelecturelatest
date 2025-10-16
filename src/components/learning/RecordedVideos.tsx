import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, CheckCircle, Clock } from "lucide-react";
import { getVideosByTopic } from "@/data/mockLearning";
import type { MockVideo } from "@/data/mockLearning";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RecordedVideosProps {
  topicId: string;
}

export const RecordedVideos = ({ topicId }: RecordedVideosProps) => {
  const videos = getVideosByTopic(topicId);
  const [selectedVideo, setSelectedVideo] = useState<MockVideo | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const categories = ["all", ...new Set(videos.map(v => v.category))];
  const filteredVideos = filterCategory === "all" 
    ? videos 
    : videos.filter(v => v.category === filterCategory);

  const handleVideoComplete = () => {
    // Mark video as completed
    if (selectedVideo) {
      setSelectedVideo({ ...selectedVideo, completed: true });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat === "all" ? "All Videos" : cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredVideos.map((video) => (
          <Card
            key={video.id}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setSelectedVideo(video)}
          >
            <CardHeader className="p-0">
              <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="bg-primary rounded-full p-4">
                    <Play className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
                {video.completed && (
                  <Badge className="absolute top-2 right-2 bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
                <Badge variant="secondary" className="absolute bottom-2 right-2">
                  {video.duration}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-1">{video.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{video.instructor}</span>
                <span>•</span>
                <Badge variant="outline">{video.category}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No videos available for this topic.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <div className="aspect-video">
                <iframe
                  src={selectedVideo.videoUrl}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{selectedVideo.duration}</span>
                    <span>•</span>
                    <span>{selectedVideo.instructor}</span>
                  </div>
                  <Badge>{selectedVideo.category}</Badge>
                </div>
                {!selectedVideo.completed && (
                  <Button onClick={handleVideoComplete}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Complete
                  </Button>
                )}
              </div>

              {/* Related videos would go here */}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
