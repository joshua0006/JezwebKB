import { Article } from '../types';
import gettingStartedWordPress from './tutorials/getting-started-wordpress.json';
import elementorBasics from './tutorials/elementor-basics.json';
import gravityFormsGuide from './tutorials/gravity-forms-guide.json';
import elementorInterfaceBasics from './tutorials/elementor-interface-basics.json';
import elementorWidgetsGuide from './tutorials/elementor-widgets-guide.json';
import elementorResponsiveDesign from './tutorials/elementor-responsive-design.json';
import elementorAdvancedTechniques from './tutorials/elementor-advanced-techniques.json';
import gravityFormsAdvanced from './tutorials/gravity-forms-advanced.json';
import gravityFormsStyling from './tutorials/gravity-forms-styling.json';
import gravityFormsNotifications from './tutorials/gravity-forms-notifications.json';
import elementorHeadingWidget from './tutorials/elementor-heading-widget.json';
import elementorImageWidget from './tutorials/elementor-image-widget.json';
import elementorTextEditorWidget from './tutorials/elementor-text-editor-widget.json';
import elementorButtonWidget from './tutorials/elementor-button-widget.json';
import elementorSectionWidget from './tutorials/elementor-section-widget.json';
import wordpressSecurity from './tutorials/wordpress-security.json';
import wordpressSpeedOptimization from './tutorials/wordpress-speed-optimization.json';
import wordpressSeoGuide from './tutorials/wordpress-seo-guide.json';
import wordpressBackupRestore from './tutorials/wordpress-backup-restore.json';
import wordpressPluginsGuide from './tutorials/wordpress-plugins-guide.json';
import wordpressMaintenance from './tutorials/wordpress-maintenance.json';
import wordpressCustomization from './tutorials/wordpress-customization.json';
import shopifyGettingStarted from './tutorials/shopify-getting-started.json';
import shopifyProductManagement from './tutorials/shopify-product-management.json';
import shopifyThemeCustomization from './tutorials/shopify-theme-customization.json';
import shopifyMarketingTools from './tutorials/shopify-marketing-tools.json';

export const articles: Article[] = [
  {
    id: '1',
    title: 'Getting Started with WordPress',
    description: 'Learn the basics of WordPress and how to manage your website effectively.',
    image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800&h=400',
    content: 'WordPress is a powerful content management system that powers millions of websites worldwide. This comprehensive guide will help you get started with managing your WordPress website effectively.\n\nFirst, let\'s understand the WordPress dashboard. When you log in to your WordPress site, you\'ll be presented with the admin dashboard. This is your control center for managing all aspects of your website.\n\nKey areas we\'ll cover:\n\n1. Posts and Pages: Learn how to create and manage your content\n2. Media Library: Understand how to handle images and other media files\n3. Themes and Customization: Make your site look exactly how you want\n4. Plugins: Extend your site\'s functionality\n5. Users: Manage who has access to your site\n\nWe\'ll walk through each of these areas step by step, ensuring you have a solid foundation for managing your WordPress website.',
    category: 'wordpress',
    tags: ['basics', 'getting-started', 'wordpress'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    createdAt: '2024-03-15',
    updatedAt: '2024-03-15',
    published: true,
    createdBy: 'admin',
    priority: 1
  },
  {
    id: '2',
    title: 'Elementor Page Builder Tutorial',
    description: 'Master the Elementor page builder to create beautiful WordPress pages.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800&h=400',
    content: 'Elementor is a drag-and-drop page builder that makes it easy to create...',
    category: 'elementor',
    tags: ['elementor', 'page-builder', 'design'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    createdAt: '2024-03-15',
    updatedAt: '2024-03-15',
    published: true,
    createdBy: 'admin',
    priority: 2
  },
  {
    id: '3',
    title: 'Creating Forms with Gravity Forms',
    description: 'Learn how to create and manage forms using Gravity Forms.',
    image: 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?auto=format&fit=crop&q=80&w=800&h=400',
    content: 'Gravity Forms is the most powerful form builder for WordPress...',
    category: 'gravity-forms',
    tags: ['forms', 'gravity-forms', 'contact'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    createdAt: '2024-03-15',
    updatedAt: '2024-03-15',
    published: true,
    createdBy: 'admin',
    priority: 3
  }
];

export function getArticleById(id: string) {
  return articles.find(article => article.id === id);
}

export function getArticlesByCategory(categoryId: string) {
  return articles.filter(article => article.category === categoryId);
}

export function getArticlesByTag(tag: string) {
  return articles.filter(article => article.tags.includes(tag));
}

export function getPublishedArticles() {
  return articles.filter(article => article.published);
}

export function getSortedArticles() {
  return [...articles].sort((a, b) => (a.priority || 999) - (b.priority || 999));
}