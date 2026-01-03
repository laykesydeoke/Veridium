export const APP_NAME = 'Veridium';
export const APP_TAGLINE = 'Where truth is refined through discourse';

export enum SessionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EVALUATING = 'evaluating',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum SessionFormat {
  ASYNC = 'async',
  SYNC = 'sync',
}

export enum EvaluationCriteria {
  ARGUMENTATION_QUALITY = 'argumentation_quality',
  COUNTERPOINT_EFFICACY = 'counterpoint_efficacy',
  COMMUNICATION_CLARITY = 'communication_clarity',
  EVIDENCE_INTEGRITY = 'evidence_integrity',
  PERSUASIVE_IMPACT = 'persuasive_impact',
}
