import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, BookOpen, Lightbulb } from 'lucide-react';
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
  };
  isActive?: boolean;
  highlightedSentence?: string;
  slideNumber?: number;
  totalSlides?: number;
  isStorySlide?: boolean;
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
  highlightedSentence,
  slideNumber = 1,
  totalSlides = 1,
  isStorySlide = false
}: PresentationSlideProps) {
  const gradientIndex = (slideNumber - 1) % slideGradients.length;
  const gradient = slideGradients[gradientIndex];

  return (
    <div className={cn(
      "h-full w-full rounded-xl overflow-hidden transition-all duration-500",
      `bg-gradient-to-br ${gradient}`,
      isActive && "shadow-2xl"
    )}>
      <div className="h-full flex flex-col p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {isStorySlide ? (
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Lightbulb className="h-6 w-6 text-amber-600" />
              </div>
            ) : (
              <div className="p-2 bg-primary/20 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            )}
            <h2 className="text-2xl font-bold text-foreground">
              {slide.title}
            </h2>
          </div>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {slideNumber} / {totalSlides}
          </Badge>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Content Column (2/3) */}
            <div className={cn(
              "lg:col-span-2 space-y-4",
              !slide.formula && !slide.keyPoints?.length && "lg:col-span-3"
            )}>
              {/* Main Content */}
              <div className={cn(
                "prose prose-lg dark:prose-invert max-w-none",
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

              {/* Infographic placeholder if mentioned */}
              {slide.infographic && (
                <div className="mt-4 p-4 bg-muted/50 rounded-xl border-2 border-dashed border-muted-foreground/20">
                  <p className="text-sm text-muted-foreground text-center">
                    📊 {slide.infographic}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar - Formula & Key Points (1/3) */}
            {(slide.formula || (slide.keyPoints && slide.keyPoints.length > 0)) && (
              <div className="space-y-4">
                {/* Formula Card */}
                {slide.formula && (
                  <div className="bg-background/80 backdrop-blur-sm p-5 rounded-xl border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
                      Formula
                    </p>
                    <div className="text-xl text-center py-2">
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
                  <div className="bg-background/80 backdrop-blur-sm p-5 rounded-xl border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
                      Key Points
                    </p>
                    <ul className="space-y-2">
                      {slide.keyPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
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
          <div className="mt-4 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="font-medium">Real-world example to help you remember!</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}