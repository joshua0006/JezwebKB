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
  slug?: string;
}

export interface ArticleFormData {
  title: string;
  content: string;
  category: Category;
  tags: string[];
  published: boolean;
  image?: string | null;
  author: string;
  publicationDate: string;
  additionalImages: string[];
  videos: string[];
}

export interface Article extends ArticleFormData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
} 