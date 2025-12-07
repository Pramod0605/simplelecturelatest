import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PresentationSlideProps {
  slide: {
    title: string;
    content: string;
    keyPoints?: string[];
    formula?: string;
  };
  isActive?: boolean;
  highlightedSentence?: string;
  slideNumber?: number;
  totalSlides?: number;
}

export function PresentationSlide({ 
  slide, 
  isActive = false,
  highlightedSentence,
  slideNumber,
  totalSlides
}: PresentationSlideProps) {
  // Highlight the current sentence being spoken
  const renderContent = () => {
    if (!highlightedSentence || !slide.content.includes(highlightedSentence)) {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {slide.content}
          </ReactMarkdown>
        </div>
      );
    }

    // Split content and highlight the current sentence
    const parts = slide.content.split(highlightedSentence);
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {parts[0]}
        </ReactMarkdown>
        <span className="bg-primary/20 px-1 rounded transition-colors duration-300">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {highlightedSentence}
          </ReactMarkdown>
        </span>
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {parts[1] || ''}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <Card className={cn(
      "transition-all duration-300",
      isActive && "ring-2 ring-primary shadow-lg"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{slide.title}</CardTitle>
          {slideNumber && totalSlides && (
            <Badge variant="secondary" className="text-xs">
              {slideNumber} / {totalSlides}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Content */}
        <div className="text-foreground leading-relaxed">
          {renderContent()}
        </div>

        {/* Formula Display */}
        {slide.formula && (
          <div className="bg-muted/50 p-4 rounded-lg border">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Formula</p>
            <div className="text-lg text-center">
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
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Key Points</p>
            <ul className="space-y-1">
              {slide.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
