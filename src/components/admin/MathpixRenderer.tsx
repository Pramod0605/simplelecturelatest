import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MathpixRendererProps {
  mmdText: string;
  title?: string;
  className?: string;
  inline?: boolean;
}

export const MathpixRenderer = ({ mmdText, title, className, inline = false }: MathpixRendererProps) => {
  // Convert Mathpix markdown syntax to standard LaTeX syntax
  const convertMathpixToStandard = (text: string) => {
    if (!text) return '';
    
    // Convert \( \) to $ $ for inline math
    let converted = text.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
    
    // Convert \[ \] to $$ $$ for display math
    converted = converted.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
    
    return converted;
  };

  if (!mmdText) {
    return (
      <Alert>
        <AlertDescription>No content available to display</AlertDescription>
      </Alert>
    );
  }

  const standardMarkdown = convertMathpixToStandard(mmdText);

  // Inline mode - render without Card wrapper
  if (inline) {
    return (
      <div className={className}>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {standardMarkdown}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  // Default mode - render with Card wrapper
  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {standardMarkdown}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
};
