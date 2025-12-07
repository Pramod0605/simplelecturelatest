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
      {/* Zoomed Infographic - Within presentation layer (not overlay) */}
      {showZoomedInfographic && slide.infographicUrl && (
        <div className={cn(
          "absolute inset-4 z-10 bg-background/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-6 border border-primary/20",
          infographicPhase === 'zooming' && "animate-in fade-in zoom-in-95 duration-500",
          infographicPhase === 'returning' && "animate-out fade-out zoom-out-95 duration-300"
        )}>
          <div className="relative w-full flex-1 flex flex-col items-center justify-center max-h-[60%]">
            <img 
              src={slide.infographicUrl} 
              alt={slide.infographic || "Infographic"} 
              className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
            />
            {slide.infographic && (
              <p className="text-center text-sm text-muted-foreground mt-2 italic">
                {slide.infographic}
              </p>
            )}
          </div>
          
          {/* Key Points in zoomed view */}
          {slide.keyPoints && slide.keyPoints.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-3 max-w-2xl">
              {slide.keyPoints.map((point, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  className="text-xs py-1 px-2.5 bg-primary/10 border-primary/30 text-primary font-medium"
                >
                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
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

        {/* Main Content Area - Key Points only (no narrative text) */}
        <div className="flex-1 flex flex-col items-center justify-center overflow-auto">
          {/* Video for Story Slides */}
          {isStorySlide && slide.videoUrl && (
            <div className="w-full max-w-2xl mb-4 rounded-lg overflow-hidden bg-black aspect-video relative">
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

          {/* Formula Card - Centered prominently */}
          {slide.formula && !showZoomedInfographic && (
            <div className="bg-background/80 backdrop-blur-sm p-6 rounded-xl border shadow-lg mb-4 max-w-lg">
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide text-center">
                Key Formula
              </p>
              <div className="text-xl text-center">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {/* Clean formula: remove existing $ signs and wrap properly */}
                  {`$$${slide.formula.replace(/^\$+|\$+$/g, '').replace(/\$\$/g, '').trim()}$$`}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Infographic Thumbnail - Only when not zoomed */}
          {slide.infographicUrl && !showZoomedInfographic && (
            <div className="bg-background/60 backdrop-blur-sm p-3 rounded-xl border shadow-sm max-w-xs">
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide flex items-center justify-center gap-1">
                <Image className="h-3 w-3" />
                Visual Diagram
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
                    "w-full max-h-32 object-contain rounded-lg transition-opacity duration-300",
                    imageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageLoaded(true)}
                />
              </div>
            </div>
          )}

          {/* Key Points - Prominent centered display */}
          {slide.keyPoints && slide.keyPoints.length > 0 && !showZoomedInfographic && (
            <div className="flex flex-col items-center gap-3 mt-4 max-w-2xl">
              {slide.keyPoints.map((point, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex items-start gap-3 bg-background/80 backdrop-blur-sm rounded-xl px-5 py-3 border border-primary/20 shadow-sm w-full",
                    "animate-in fade-in slide-in-from-bottom-2 duration-500"
                  )}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-base font-medium text-foreground">{point}</span>
                </div>
              ))}
            </div>
          )}

          {/* Infographic Description (only if no image URL) */}
          {slide.infographic && !slide.infographicUrl && !showZoomedInfographic && (
            <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/20 max-w-lg mt-4">
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

        {/* Bottom Section - Subtitle Only */}
        <div className="mt-auto">
          {/* Subtitle Bar - Fixed at bottom, synced with narration */}
          {currentSubtitle && (
            <div className="bg-gradient-to-r from-background/95 via-primary/5 to-background/95 backdrop-blur-sm border border-primary/20 rounded-lg px-4 py-2.5">
              <p className="text-sm text-foreground leading-relaxed line-clamp-2 text-center font-medium animate-in fade-in duration-200">
                {currentSubtitle}
              </p>
            </div>
          )}

          {/* Tips & Tricks Special Footer */}
          {isTipsSlide && (
            <div className="p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20 mt-2">
              <p className="text-xs text-purple-700 dark:text-purple-400 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="font-medium">Memory tricks to help you remember!</span>
              </p>
            </div>
          )}

          {/* Story Slide Special Footer */}
          {isStorySlide && !isTipsSlide && (
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 mt-2">
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