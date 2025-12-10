import { FeatureFlag, FlagType, Environment, AuditLog } from '../types';

export const INITIAL_FLAGS: FeatureFlag[] = [
  {
    id: '1',
    key: 'new-checkout-flow',
    name: 'New Checkout Flow',
    description: 'Redesigned checkout page with Stripe Elements and 1-click buy.',
    type: FlagType.BOOLEAN,
    isEnabled: true,
    rolloutPercentage: 25,
    environment: Environment.PRODUCTION,
    variants: [
      { id: 'v1', name: 'Control', key: 'control', weight: 50 },
      { id: 'v2', name: 'Treatment', key: 'treatment', weight: 50 }
    ],
    rules: [
      { id: 'r1', attribute: 'email', operator: 'CONTAINS', values: ['@company.com'] }
    ],
    lastUpdated: new Date().toISOString(),
    owner: 'Sarah Engineer'
  },
  {
    id: '2',
    key: 'dark-mode-beta',
    name: 'Dark Mode Beta',
    description: 'System-wide dark mode toggle for early adopters.',
    type: FlagType.BOOLEAN,
    isEnabled: false,
    rolloutPercentage: 0,
    environment: Environment.STAGING,
    variants: [],
    rules: [],
    lastUpdated: new Date(Date.now() - 86400000).toISOString(),
    owner: 'Mike Product'
  },
  {
    id: '3',
    key: 'ai-recommendations',
    name: 'AI Product Recommendations',
    description: 'Use Gemini to suggest products on the home page.',
    type: FlagType.MULTIVARIATE,
    isEnabled: true,
    rolloutPercentage: 100,
    environment: Environment.DEVELOPMENT,
    variants: [
      { id: 'v1', name: 'Model A (Aggressive)', key: 'model_a', weight: 33 },
      { id: 'v2', name: 'Model B (Conservative)', key: 'model_b', weight: 33 },
      { id: 'v3', name: 'Control', key: 'control', weight: 34 }
    ],
    rules: [],
    lastUpdated: new Date(Date.now() - 172800000).toISOString(),
    owner: 'Sarah Engineer'
  }
];

export const INITIAL_LOGS: AuditLog[] = [
  {
    id: 'l1',
    action: 'Toggle Enabled',
    flagKey: 'new-checkout-flow',
    actor: 'Sarah Engineer',
    timestamp: new Date().toISOString(),
    environment: Environment.PRODUCTION
  },
  {
    id: 'l2',
    action: 'Created Flag',
    flagKey: 'dark-mode-beta',
    actor: 'Mike Product',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    environment: Environment.STAGING
  }
];