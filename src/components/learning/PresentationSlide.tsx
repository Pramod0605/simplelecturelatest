import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, BookOpen, Lightbulb, Image, Loader2, Sparkles, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PresentationSlideProps {
  slide: {
    title: string;
    content: string;
    keyPoints?: string[];
    formula?: string;
    narration?: string;
    isStory?: boolean;
    isTips?: boolean;
    infographic?: string;
    infographicUrl?: string;
    videoUrl?: string;
  };
  isActive?: boolean;
  slideNumber?: number;
  totalSlides?: number;
  isStorySlide?: boolean;
  currentSubtitle?: string;
  isNarrating?: boolean;
  infographicPhase?: 'hidden' | 'zooming' | 'zoomed' | 'returning';
  onReplaySlide?: () => void;
}

// Gradient backgrounds for different slides
const slideGradients = [
  'from-blue-500/10 via-background to-indigo-500/10',
  'from-purple-500/10 via-background to-pink-500/10',
  'from-emerald-500/10 via-background to-teal-500/10',
  'from-orange-500/10 via-background to-amber-500/10',
  'from-rose-500/10 via-background to-red-500/10',
];

export function PresentationSlide({ 
  slide, 
  isActive = false,
  slideNumber = 1,
  totalSlides = 1,
  isStorySlide = false,
  currentSubtitle,
  isNarrating = false,
  infographicPhase = 'hidden',
  onReplaySlide,
}: PresentationSlideProps) {
  const [videoLoading, setVideoLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const gradientIndex = (slideNumber - 1) % slideGradients.length;
  const gradient = slideGradients[gradientIndex];

  // Determine if infographic should be shown in zoomed/overlay mode
  const showZoomedInfographic = slide.infographicUrl && (infographicPhase === 'zooming' || infographicPhase === 'zoomed' || infographicPhase === 'returning');

  const isTipsSlide = slide.isTips;

  return (
    <div className={cn(
      "h-full w-full rounded-xl overflow-hidden transition-all duration-500 relative",
      `bg-gradient-to-br ${gradient}`,
      isActive && "shadow-2xl"
    )}>
      {/* Zoomed Infographic Overlay - Shows during infographic phase */}
      {(infographicPhase === 'zooming' || infographicPhase === 'zoomed' || infographicPhase === 'returning') && slide.infographicUrl && (
        <div className={cn(
          "absolute inset-0 z-20 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6",
          infographicPhase === 'zooming' && "animate-in fade-in zoom-in-95 duration-700",
          infographicPhase === 'returning' && "animate-out fade-out zoom-out-95 duration-500"
        )}>
          <div className="relative max-w-3xl w-full flex-1 flex flex-col items-center justify-center">
            <img 
              src={slide.infographicUrl} 
              alt={slide.infographic || "Infographic"} 
              className="w-full max-h-[55vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-105 duration-1000"
            />
            <p className="text-center text-sm text-muted-foreground mt-3 italic">
              {slide.infographic}
            </p>
          </div>
          
          {/* Key Points in zoomed view */}
          {slide.keyPoints && slide.keyPoints.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-4 max-w-3xl">
              {slide.keyPoints.map((point, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  className={cn(
                    "text-sm py-1.5 px-3 bg-primary/10 border-primary/30 text-primary font-medium",
                    "animate-in fade-in slide-in-from-bottom-2 duration-500"
                  )}
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5" />
                  {point}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="h-full flex flex-col p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {isTipsSlide ? (
              <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
            ) : isStorySlide ? (
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Lightbulb className="h-5 w-5 text-amber-600" />
              </div>
            ) : (
              <div className="p-2 bg-primary/20 rounded-lg">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
            )}
            <h2 className="text-lg font-bold text-foreground">
              {slide.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {onReplaySlide && !isNarrating && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReplaySlide}
                className="h-7 px-2 text-xs"
                title="Replay this slide"
              >
                <Play className="h-3 w-3 mr-1" />
                Replay
              </Button>
            )}
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {slideNumber} / {totalSlides}
            </Badge>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto mb-3">
          {/* Video for Story Slides */}
          {isStorySlide && slide.videoUrl && (
            <div className="mb-3 rounded-lg overflow-hidden bg-black aspect-video relative">
              {videoLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
              <video
                src={slide.videoUrl}
                controls
                autoPlay
                muted
                className="w-full h-full object-cover"
                onLoadStart={() => setVideoLoading(true)}
                onLoadedData={() => setVideoLoading(false)}
              >
                Your browser does not support video playback.
              </video>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
            {/* Content Column (2/3) */}
            <div className={cn(
              "lg:col-span-2 space-y-2",
              !slide.formula && !slide.infographicUrl && "lg:col-span-3"
            )}>
              {/* Main Content */}
              <div className={cn(
                "prose prose-sm dark:prose-invert max-w-none",
                "prose-headings:text-foreground prose-p:text-foreground/90",
                "prose-strong:text-primary prose-strong:font-semibold"
              )}>
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {slide.content}
                </ReactMarkdown>
              </div>

              {/* Infographic Description (only if no image URL) */}
              {slide.infographic && !slide.infographicUrl && (
                <div className="p-3 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <Image className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-primary mb-1">Visual Diagram</p>
                      <p className="text-sm text-muted-foreground">
                        {slide.infographic}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Infographic Image (small thumbnail) & Formula (1/3) */}
            {(slide.formula || slide.infographicUrl) && !showZoomedInfographic && (
              <div className="space-y-2">
                {/* Infographic Image - Small Thumbnail */}
                {slide.infographicUrl && (
                  <div className="bg-background/80 backdrop-blur-sm p-2 rounded-xl border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide flex items-center gap-1">
                      <Image className="h-3 w-3" />
                      Diagram
                    </p>
                    <div className="relative rounded-lg overflow-hidden bg-muted/30">
                      {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                      )}
                      <img 
                        src={slide.infographicUrl} 
                        alt={slide.infographic || "Infographic"} 
                        className={cn(
                          "w-full max-h-28 object-contain rounded-lg transition-opacity duration-300",
                          imageLoaded ? "opacity-100" : "opacity-0"
                        )}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageLoaded(true)}
                      />
                    </div>
                  </div>
                )}

                {/* Formula Card */}
                {slide.formula && (
                  <div className="bg-background/80 backdrop-blur-sm p-3 rounded-xl border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">
                      Formula
                    </p>
                    <div className="text-base text-center">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {`$$${slide.formula}$$`}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - Key Points + Subtitle */}
        <div className="mt-auto space-y-2">
          {/* Key Points as horizontal badges (when infographic not zoomed) */}
          {slide.keyPoints && slide.keyPoints.length > 0 && !showZoomedInfographic && (
            <div className="flex flex-wrap gap-1.5">
              {slide.keyPoints.map((point, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  className="text-xs py-1 px-2 bg-background/60 border-primary/20"
                >
                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                  {point}
                </Badge>
              ))}
            </div>
          )}

          {/* Subtitle Bar - Fixed at bottom, 2 lines max, dynamic */}
          {currentSubtitle && (
            <div className="bg-gradient-to-r from-background/95 via-primary/5 to-background/95 backdrop-blur-sm border border-primary/20 rounded-lg px-4 py-3">
              <p className="text-sm text-foreground leading-relaxed line-clamp-2 text-center font-medium animate-in fade-in duration-300">
                {currentSubtitle}
              </p>
            </div>
          )}

          {/* Tips & Tricks Special Footer */}
          {isTipsSlide && (
            <div className="p-2.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
              <p className="text-xs text-purple-700 dark:text-purple-400 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="font-medium">Memory tricks to help you remember!</span>
              </p>
            </div>
          )}

          {/* Story Slide Special Footer */}
          {isStorySlide && !isTipsSlide && (
            <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Lightbulb className="h-3.5 w-3.5" />
                <span className="font-medium">Real-world example to help you remember!</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}