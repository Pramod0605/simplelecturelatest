import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, BookOpen, Lightbulb, Image, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PresentationSlideProps {
  slide: {
    title: string;
    content: string;
    keyPoints?: string[];
    formula?: string;
    narration?: string;
    isStory?: boolean;
    infographic?: string;
    infographicUrl?: string;
    videoUrl?: string;
  };
  isActive?: boolean;
  slideNumber?: number;
  totalSlides?: number;
  isStorySlide?: boolean;
  currentSubtitle?: string;
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
}: PresentationSlideProps) {
  const [videoLoading, setVideoLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const gradientIndex = (slideNumber - 1) % slideGradients.length;
  const gradient = slideGradients[gradientIndex];

  return (
    <div className={cn(
      "h-full w-full rounded-xl overflow-hidden transition-all duration-500",
      `bg-gradient-to-br ${gradient}`,
      isActive && "shadow-2xl"
    )}>
      <div className="h-full flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isStorySlide ? (
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Lightbulb className="h-5 w-5 text-amber-600" />
              </div>
            ) : (
              <div className="p-2 bg-primary/20 rounded-lg">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
            )}
            <h2 className="text-xl font-bold text-foreground">
              {slide.title}
            </h2>
          </div>
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            {slideNumber} / {totalSlides}
          </Badge>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {/* Video for Story Slides */}
          {isStorySlide && slide.videoUrl && (
            <div className="mb-4 rounded-lg overflow-hidden bg-black aspect-video relative">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            {/* Content Column (2/3) */}
            <div className={cn(
              "lg:col-span-2 space-y-3",
              !slide.formula && !slide.keyPoints?.length && !slide.infographicUrl && "lg:col-span-3"
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

              {/* Current Subtitle Display - Moved to slide area */}
              {currentSubtitle && (
                <div className="p-3 bg-background/80 backdrop-blur-sm rounded-lg border border-primary/20 shadow-sm">
                  <p className="text-sm text-foreground/90 italic leading-relaxed">
                    "{currentSubtitle.length > 200 ? currentSubtitle.substring(0, 200) + '...' : currentSubtitle}"
                  </p>
                </div>
              )}

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

            {/* Sidebar - Infographic Image, Formula & Key Points (1/3) */}
            {(slide.formula || (slide.keyPoints && slide.keyPoints.length > 0) || slide.infographicUrl) && (
              <div className="space-y-3">
                {/* Infographic Image - Prominently Displayed */}
                {slide.infographicUrl && (
                  <div className="bg-background/80 backdrop-blur-sm p-3 rounded-xl border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide flex items-center gap-1">
                      <Image className="h-3 w-3" />
                      Visual Diagram
                    </p>
                    <div className="relative rounded-lg overflow-hidden bg-muted/30">
                      {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      )}
                      <img 
                        src={slide.infographicUrl} 
                        alt={slide.infographic || "Infographic"} 
                        className={cn(
                          "w-full max-h-48 object-contain rounded-lg transition-opacity duration-300",
                          imageLoaded ? "opacity-100" : "opacity-0"
                        )}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageLoaded(true)}
                      />
                    </div>
                    {slide.infographic && (
                      <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">
                        {slide.infographic}
                      </p>
                    )}
                  </div>
                )}

                {/* Formula Card */}
                {slide.formula && (
                  <div className="bg-background/80 backdrop-blur-sm p-4 rounded-xl border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                      Formula
                    </p>
                    <div className="text-lg text-center py-1">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {`$$${slide.formula}$$`}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Key Points */}
                {slide.keyPoints && slide.keyPoints.length > 0 && (
                  <div className="bg-background/80 backdrop-blur-sm p-4 rounded-xl border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                      Key Points
                    </p>
                    <ul className="space-y-1.5">
                      {slide.keyPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-foreground/90">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Story Slide Special Footer */}
        {isStorySlide && (
          <div className="mt-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5" />
              <span className="font-medium">Real-world example to help you remember!</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
