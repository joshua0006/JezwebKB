import { Category } from './index';

export interface TutorialBlock {
  id: string;
  type: 'heading' | 'text' | 'code' | 'image' | 'video';
  content: string;
  order: number;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  priority?: number;
  category: Category;
  tags: string[];
  image?: string;
  videoUrl?: string;
  blocks: TutorialBlock[];
  createdAt: string;
  updatedAt: string;
  author: string;
  status: 'published' | 'draft';
} 