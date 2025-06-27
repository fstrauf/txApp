import posthog from 'posthog-js';
import { DEMO_DASHBOARD_HEADLINE_TEST, DEMO_DASHBOARD_CTA_TEST, getVariantDisplayText } from './abTestingConfig';

export const useDashboardAbTesting = (status: string) => {
  // A/B Testing for demo dashboard messaging
  const headlineVariant = posthog.getFeatureFlag('demo-dashboard-headline') as string;
  const ctaButtonVariant = posthog.getFeatureFlag('demo-dashboard-cta-button') as string;

  // Get headline text based on A/B test variant
  const getHeadlineText = () => {
    return getVariantDisplayText(DEMO_DASHBOARD_HEADLINE_TEST, headlineVariant || 'control');
  };

  // Get CTA button text based on A/B test variant
  const getCtaButtonText = () => {
    // Handle loading states first
    if (status === 'loading') {
      return 'Loading...';
    }
    
    // Get A/B test variant text, fallback to default based on auth status
    const variantText = getVariantDisplayText(DEMO_DASHBOARD_CTA_TEST, ctaButtonVariant || 'control');
    
    // For control variant, customize based on auth status
    if ((ctaButtonVariant || 'control') === 'control') {
      return status === 'unauthenticated' 
        ? 'Make This Dashboard Yours'
        : 'Make This My Dashboard';
    }
    
    return variantText;
  };

  return {
    headlineVariant,
    ctaButtonVariant,
    getHeadlineText,
    getCtaButtonText,
  };
}; 