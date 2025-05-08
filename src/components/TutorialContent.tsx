import { ArticleContent } from './ArticleContent';

interface TutorialContentProps {
  content: string;
}

// This component provides the same functionality as ArticleContent
// but with a different name to maintain semantic clarity in the codebase
export const TutorialContent = ({ content }: TutorialContentProps) => {
  return <ArticleContent content={content} />;
}; 