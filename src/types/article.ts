import { Category, TutorialBlock } from './index';

export interface Article {
  id: string;
  title: string;
  content: string;
  category: Category;
  tags: string[];
  image?: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  blocks?: TutorialBlock[];
}

export interface ArticleFormData {
  title: string;
  content: string;
  category: Category;
  tags: string[];
  image?: string | null;
  published: boolean;
} 