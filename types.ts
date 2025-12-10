export enum FlagType {
  BOOLEAN = 'BOOLEAN',
  MULTIVARIATE = 'MULTIVARIATE'
}

export enum Environment {
  DEVELOPMENT = 'Development',
  STAGING = 'Staging',
  PRODUCTION = 'Production'
}

export interface Variant {
  id: string;
  name: string;
  weight: number; // 0-100
  key: string;
}

export interface TargetingRule {
  id: string;
  attribute: string;
  operator: 'EQUALS' | 'CONTAINS' | 'ONE_OF';
  values: string[];
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  type: FlagType;
  isEnabled: boolean;
  rolloutPercentage: number;
  environment: Environment;
  variants: Variant[];
  rules: TargetingRule[];
  lastUpdated: string;
  owner: string;
}

export interface AuditLog {
  id: string;
  action: string;
  flagKey: string;
  actor: string;
  timestamp: string;
  environment: Environment;
}

export interface AIAnalysisResult {
  riskScore: number; // 0-100
  summary: string;
  suggestions: string[];
}
