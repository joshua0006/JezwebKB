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
  headerMedia?: HeaderMedia | null;
}

export interface HeaderMedia {
  url: string;
  type: 'image' | 'video';
  caption?: string;
  fileName?: string;
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
  headerMedia?: HeaderMedia | null;
}

export interface Article extends ArticleFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
} 