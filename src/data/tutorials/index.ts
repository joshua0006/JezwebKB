import gettingStartedWordPress from './getting-started-wordpress.json';
import elementorBasics from './elementor-basics.json';
import gravityFormsGuide from './gravity-forms-guide.json';
import elementorInterfaceBasics from './elementor-interface-basics.json';
import elementorWidgetsGuide from './elementor-widgets-guide.json';
import elementorResponsiveDesign from './elementor-responsive-design.json';
import elementorAdvancedTechniques from './elementor-advanced-techniques.json';
import gravityFormsAdvanced from './gravity-forms-advanced.json';
import gravityFormsStyling from './gravity-forms-styling.json';
import gravityFormsNotifications from './gravity-forms-notifications.json';
import elementorHeadingWidget from './elementor-heading-widget.json';
import elementorImageWidget from './elementor-image-widget.json';
import elementorTextEditorWidget from './elementor-text-editor-widget.json';
import elementorButtonWidget from './elementor-button-widget.json';
import elementorSectionWidget from './elementor-section-widget.json';
import wordpressSecurity from './wordpress-security.json';
import wordpressSpeedOptimization from './wordpress-speed-optimization.json';
import wordpressSeoGuide from './wordpress-seo-guide.json';
import wordpressBackupRestore from './wordpress-backup-restore.json';
import wordpressPluginsGuide from './wordpress-plugins-guide.json';
import wordpressMaintenance from './wordpress-maintenance.json';
import wordpressCustomization from './wordpress-customization.json';
import shopifyGettingStarted from './shopify-getting-started.json';
import shopifyProductManagement from './shopify-product-management.json';
import shopifyThemeCustomization from './shopify-theme-customization.json';
import shopifyMarketingTools from './shopify-marketing-tools.json';

export const tutorials = [
  gettingStartedWordPress,
  wordpressSecurity,
  wordpressSpeedOptimization,
  wordpressSeoGuide,
  wordpressBackupRestore,
  wordpressPluginsGuide,
  wordpressMaintenance,
  wordpressCustomization,
  shopifyGettingStarted,
  shopifyProductManagement,
  shopifyThemeCustomization,
  shopifyMarketingTools,
  elementorBasics,
  gravityFormsGuide,
  elementorInterfaceBasics,
  elementorWidgetsGuide,
  elementorResponsiveDesign,
  elementorAdvancedTechniques,
  gravityFormsAdvanced,
  gravityFormsStyling,
  gravityFormsNotifications,
  elementorHeadingWidget,
  elementorImageWidget,
  elementorTextEditorWidget,
  elementorButtonWidget,
  elementorSectionWidget,
];

export function getTutorialById(id: string) {
  return tutorials.find(tutorial => tutorial.id === id);
}

export function getTutorialsByCategory(categoryId: string) {
  return tutorials.filter(tutorial => tutorial.category === categoryId);
}

export function getTutorialsByTag(tag: string) {
  return tutorials.filter(tutorial => tutorial.tags.includes(tag));
}

export function getPublishedTutorials() {
  return tutorials.filter(tutorial => tutorial.status === 'published');
}

export function getSortedTutorials() {
  return [...tutorials].sort((a, b) => (a.priority || 999) - (b.priority || 999));
}