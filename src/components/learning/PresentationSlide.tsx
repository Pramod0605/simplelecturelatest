import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, BookOpen, Lightbulb, Image as ImageIcon, Loader2, Sparkles, Play, X } from 'lucide-react';
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
  isFullScreen?: boolean;
  narrationText?: string;
}

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
  isFullScreen = false,
  narrationText,
}: PresentationSlideProps) {
  const [videoLoading, setVideoLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const gradientIndex = (slideNumber - 1) % slideGradients.length;
  const gradient = slideGradients[gradientIndex];

  const showZoomedInfographic = slide.infographicUrl && (infographicPhase === 'zooming' || infographicPhase === 'zoomed' || infographicPhase === 'returning');
  const isTipsSlide = slide.isTips;

  return (
    <div className={cn(
      "h-full w-full rounded-xl overflow-hidden transition-all duration-500 relative",
      `bg-gradient-to-br ${gradient}`,
      isActive && "shadow-2xl"
    )}>
      {/* Full-screen Infographic Zoom - Fills entire presentation area */}
      {showZoomedInfographic && slide.infographicUrl && (
        <div className={cn(
          "absolute inset-0 z-20 bg-background/98 backdrop-blur-sm flex flex-col items-center justify-center p-8",
          infographicPhase === 'zooming' && "animate-in fade-in zoom-in-95 duration-500",
          infographicPhase === 'returning' && "animate-out fade-out zoom-out-95 duration-300"
        )}>
          {/* Large Infographic - Fills the space */}
          <div className="relative flex-1 w-full flex items-center justify-center">
            <img 
              src={slide.infographicUrl} 
              alt="Visual diagram" 
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
          </div>
          
          {/* Key Points below infographic in zoom view */}
          {slide.keyPoints && slide.keyPoints.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-4 max-w-4xl">
              {slide.keyPoints.map((point, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  className="text-sm py-1.5 px-3 bg-primary/10 border-primary/30 text-primary font-medium"
                >
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5" />
                  {point}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="h-full flex flex-col p-4 md:p-6">
        {/* Header - Compact */}
        <div className="flex items-center justify-between mb-4 shrink-0">
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
            <h2 className={cn(
              "font-bold text-foreground",
              isFullScreen ? "text-2xl" : "text-lg"
            )}>
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

        {/* Main Content - 2 Column Layout */}
        <div className={cn(
          "flex-1 flex gap-4 overflow-hidden min-h-0",
          isFullScreen ? "gap-6" : "gap-4"
        )}>
          {/* Left Column - Key Pointers (40%) */}
          <div className="w-2/5 flex flex-col gap-3 overflow-auto">
            {/* Formula Card */}
            {slide.formula && !showZoomedInfographic && (
              <div className="bg-background/80 backdrop-blur-sm p-4 rounded-xl border shadow-lg">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                  Key Formula
                </p>
                <div className={cn("text-center", isFullScreen ? "text-2xl" : "text-lg")}>
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {`$$${slide.formula.replace(/^\$+|\$+$/g, '').replace(/\$\$/g, '').trim()}$$`}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Key Points */}
            {slide.keyPoints && slide.keyPoints.length > 0 && !showZoomedInfographic && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Key Points
                </p>
                {slide.keyPoints.map((point, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "flex items-start gap-2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-primary/20",
                      "animate-in fade-in slide-in-from-left-2 duration-500"
                    )}
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span className={cn(
                      "font-medium text-foreground",
                      isFullScreen ? "text-base" : "text-sm"
                    )}>{point}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tips footer */}
            {isTipsSlide && (
              <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20 mt-auto">
                <p className="text-xs text-purple-700 dark:text-purple-400 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="font-medium">Memory tricks to help you remember!</span>
                </p>
              </div>
            )}

            {/* Story footer */}
            {isStorySlide && !isTipsSlide && (
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 mt-auto">
                <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span className="font-medium">Real-world example!</span>
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Infographic + Narration (60%) */}
          <div className="w-3/5 flex flex-col gap-3 overflow-hidden">
            {/* Video for Story Slides */}
            {isStorySlide && slide.videoUrl && !showZoomedInfographic && (
              <div className="w-full rounded-lg overflow-hidden bg-black aspect-video relative shrink-0">
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

            {/* Infographic Thumbnail */}
            {slide.infographicUrl && !showZoomedInfographic && (
              <div className="bg-background/60 backdrop-blur-sm p-3 rounded-xl border shadow-sm flex-1 min-h-0 flex flex-col">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide flex items-center gap-1 shrink-0">
                  <ImageIcon className="h-3 w-3" />
                  Visual Diagram
                </p>
                <div className="relative rounded-lg overflow-hidden bg-muted/30 flex-1 min-h-0 flex items-center justify-center">
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                  <img 
                    src={slide.infographicUrl} 
                    alt="Visual diagram" 
                    className={cn(
                      "max-w-full max-h-full object-contain rounded-lg transition-opacity duration-300",
                      imageLoaded ? "opacity-100" : "opacity-0"
                    )}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageLoaded(true)}
                  />
                </div>
              </div>
            )}

            {/* Narration Text Display */}
            {narrationText && !showZoomedInfographic && (
              <div className="bg-background/80 backdrop-blur-sm p-4 rounded-xl border flex-1 min-h-0 overflow-auto">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide shrink-0">
                  Narration
                </p>
                <p className={cn(
                  "text-muted-foreground leading-relaxed",
                  isFullScreen ? "text-base" : "text-sm"
                )}>
                  {narrationText}
                </p>
              </div>
            )}

            {/* Infographic Description (no URL) */}
            {slide.infographic && !slide.infographicUrl && !showZoomedInfographic && (
              <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <ImageIcon className="h-4 w-4 text-primary" />
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
        </div>

        {/* Bottom: Subtitle Bar */}
        {currentSubtitle && (
          <div className="mt-4 shrink-0">
            <div className={cn(
              "bg-gradient-to-r from-background/95 via-primary/5 to-background/95 backdrop-blur-sm border border-primary/20 rounded-lg px-4 py-3",
              isFullScreen && "px-6 py-4"
            )}>
              <p className={cn(
                "text-foreground leading-relaxed line-clamp-2 text-center font-medium animate-in fade-in duration-200",
                isFullScreen ? "text-lg" : "text-sm"
              )}>
                {currentSubtitle}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
