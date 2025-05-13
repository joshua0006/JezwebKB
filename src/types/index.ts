export interface TutorialBlock {
  id: string;
  type: 'heading' | 'text' | 'image' | 'video' | 'button' | 'divider' | 'spacer' | 'icon';
  content: string;
  order: number;
}

export interface Article {
  id: string;
  title: string;
  priority: number;
  description: string;
  blocks: TutorialBlock[];
  category: Category;
  tags: string[];
  image: string;
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
  vipOnly?: boolean;
  vipUsers?: string[]; // Array of VIP user IDs who can access this tutorial
}

export type Category = string;

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'vip' | 'user';
  favorites?: string[]; // Array of tutorial IDs
  assignedTutorials?: string[]; // Array of VIP-only tutorial IDs
  createdAt: string;
  updatedAt: string;
}

export interface Tutorial extends Article {
  vipOnly?: boolean; // If true, only VIP users can access this tutorial
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
}