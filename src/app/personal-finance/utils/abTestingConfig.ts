// A/B Testing Configuration for Personal Finance Dashboard
// This file contains the configuration for PostHog experiments
//
// Implementation Status: ✅ ACTIVE
// - Demo dashboard headline test (4 variants)
// - Demo dashboard CTA button test (4 variants)
// - Events tracked: demo_dashboard_banner_viewed, demo_dashboard_cta_button_clicked
// - PostHog experiments configured and running

export interface ABTestVariant {
  key: string;
  name: string;
  description: string;
}

export interface ABTestConfig {
  featureFlagKey: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  defaultVariant: string;
}

// Demo Dashboard Headline A/B Test
export const DEMO_DASHBOARD_HEADLINE_TEST: ABTestConfig = {
  featureFlagKey: 'demo-dashboard-headline',
  name: 'Demo Dashboard Headline Test',
  description: 'Test different headline variations on the demo dashboard to improve conversion',
  variants: [
    {
      key: 'control',
      name: 'Control',
      description: '✨ Experience Your Financial Future'
    },
    {
      key: 'test',
      name: 'Test - Action Focused',
      description: 'See Where Your Money Actually Goes - Upload Your Data to Start'
    },
    {
      key: 'test_group_2',
      name: 'Test Group 2 - Benefit Focused',
      description: 'Most Users Save $200+/Month - Find Your Hidden Expenses'
    },
    {
      key: 'test_group_3',
      name: 'Test Group 3 - Trust Focused',
      description: 'Your Data is 100% Private - See Real Insights in 2 Minutes'
    }
  ],
  defaultVariant: 'control'
};

// Demo Dashboard CTA Button A/B Test
export const DEMO_DASHBOARD_CTA_TEST: ABTestConfig = {
  featureFlagKey: 'demo-dashboard-cta-button',
  name: 'Demo Dashboard CTA Button Test',
  description: 'Test different CTA button text variations to improve conversion',
  variants: [
    {
      key: 'control',
      name: 'Control - Free Offer',
      description: 'Get My Free Spreadsheet'
    },
    {
      key: 'test',
      name: 'Test - Action Focused',
      description: 'Start My Financial Analysis'
    },
    {
      key: 'test_group_2',
      name: 'Test Group 2 - Benefit Focused',
      description: 'See My Real Numbers'
    },
    {
      key: 'test_group_3',
      name: 'Test Group 3 - Direct Offer',
      description: 'Get Started Free'
    }
  ],
  defaultVariant: 'control'
};

// All A/B Tests Configuration
export const AB_TESTS = [
  DEMO_DASHBOARD_HEADLINE_TEST,
  DEMO_DASHBOARD_CTA_TEST
];

// PostHog Setup Instructions
export const POSTHOG_SETUP_INSTRUCTIONS = `
## PostHog A/B Testing Setup Instructions

### 1. Create Feature Flags in PostHog Dashboard

#### Demo Dashboard Headline Test
- **Feature Flag Key**: demo-dashboard-headline
- **Name**: Demo Dashboard Headline Test
- **Description**: Test different headline variations on the demo dashboard
- **Variants**:
  - control: "Experience Your Financial Future"
  - test-a: "See Where Your Money Actually Goes - Upload Your Data to Start"
  - test-b: "Most Users Save $200+/Month - Find Your Hidden Expenses"
  - test-c: "Your Data is 100% Private - See Real Insights in 2 Minutes"
- **Traffic Allocation**: 25% each variant
- **Release Conditions**: 
  - Property: is_first_time_user = true
  - OR Property: user_authenticated = false

#### Demo Dashboard CTA Button Test  
- **Feature Flag Key**: demo-dashboard-cta-button
- **Name**: Demo Dashboard CTA Button Test
- **Description**: Test urgency-focused CTA button variations (test_group_3 showing best performance)
- **Variants**:
  - control: "Stop Wasting Money Today"
  - test: "Catch My Overspending Now"
  - test_group_2: "Show Me Where I'm Bleeding Money"
  - test_group_3: "Find My Money Leaks Now" (WINNER - Current Default)
- **Traffic Allocation**: 25% each variant (all urgency-focused themes)
- **Release Conditions**: 
  - Property: is_first_time_user = true
  - OR Property: user_authenticated = false

### 2. Events Being Tracked

#### Exposure Events
- **demo_dashboard_banner_viewed**: Tracks when users see the demo banner
  - Properties: headline_variant, cta_variant, is_first_time_user, user_authenticated

#### Conversion Events
- **demo_dashboard_cta_clicked**: Tracks when users click the CTA button
  - Properties: headline_variant, cta_variant, is_first_time_user, user_authenticated

#### Success Metrics to Monitor
- **dashboard_data_management_drawer_opened**: User opens data management (primary conversion)
- **dashboard_spreadsheet_linked_successfully**: User successfully links spreadsheet (ultimate conversion)

### 3. Analysis Recommendations

#### Primary Metrics
- Click-through rate (CTR): demo_dashboard_cta_clicked / demo_dashboard_banner_viewed
- Conversion rate: dashboard_data_management_drawer_opened / demo_dashboard_banner_viewed
- Success rate: dashboard_spreadsheet_linked_successfully / demo_dashboard_banner_viewed

#### Secondary Metrics
- Time to conversion
- User engagement with different features
- Drop-off rates at each step

#### Statistical Significance
- Run test for at least 1000 exposures per variant
- Aim for 95% confidence level
- Monitor for at least 1-2 weeks to account for day-of-week effects

### 4. Implementation Notes
- Tests are only shown to first-time users (isFirstTimeUser = true)
- Feature flags are checked using posthog.getFeatureFlag()
- All variants gracefully fall back to control if feature flag is not available
- Events include both individual variant tracking and combined experiment tracking
`;

// Helper function to get variant display text
export const getVariantDisplayText = (testConfig: ABTestConfig, variantKey: string): string => {
  const variant = testConfig.variants.find(v => v.key === variantKey);
  return variant ? variant.description : testConfig.variants.find(v => v.key === testConfig.defaultVariant)?.description || '';
};

// Helper function to validate A/B test configuration
export const validateABTestSetup = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  AB_TESTS.forEach(test => {
    // Check if feature flag key is valid
    if (!test.featureFlagKey || test.featureFlagKey.length < 3) {
      errors.push(`Invalid feature flag key for ${test.name}`);
    }
    
    // Check if variants are properly configured
    if (test.variants.length < 2) {
      errors.push(`${test.name} must have at least 2 variants`);
    }
    
    // Check if default variant exists
    const hasDefaultVariant = test.variants.some(v => v.key === test.defaultVariant);
    if (!hasDefaultVariant) {
      errors.push(`Default variant '${test.defaultVariant}' not found in ${test.name}`);
    }
    
    // Check for duplicate variant keys
    const variantKeys = test.variants.map(v => v.key);
    const uniqueKeys = new Set(variantKeys);
    if (variantKeys.length !== uniqueKeys.size) {
      errors.push(`Duplicate variant keys found in ${test.name}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 