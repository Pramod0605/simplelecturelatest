import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
// @ts-ignore - mathpix-markdown-it types may not be available
import MathpixMarkdown from 'mathpix-markdown-it';
import 'katex/dist/katex.min.css';

interface MathpixRendererProps {
  mmdText: string;
  title?: string;
  className?: string;
}

export const MathpixRenderer = ({ mmdText, title, className }: MathpixRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderMMD = async () => {
      if (!containerRef.current || !mmdText) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Initialize Mathpix Markdown renderer
        const mmd = new MathpixMarkdown({
          htmlTags: true,
          width: 800,
          outMath: {
            include_asciimath: false,
            include_mathml: false,
            include_latex: true,
            include_svg: false,
            include_table_html: true,
            include_tsv: false,
          }
        });

        // Render MMD to HTML
        const html = mmd.render(mmdText);

        if (containerRef.current) {
          containerRef.current.innerHTML = html;
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error rendering MMD:', err);
        setError('Failed to render mathematical content');
        setIsLoading(false);
      }
    };

    renderMMD();
  }, [mmdText]);

  if (!mmdText) {
    return (
      <Alert>
        <AlertDescription>No content available to display</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Rendering mathematical content...</span>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div 
          ref={containerRef} 
          className="mathpix-content prose prose-sm max-w-none dark:prose-invert"
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      </CardContent>
    </Card>
  );
};
