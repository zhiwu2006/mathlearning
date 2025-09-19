export interface VariableSpec {
  type: 'int' | 'float' | 'choice';
  range?: {
    min: number;
    max: number;
  };
  choices?: number[];
  constraints?: string[];
}

export interface Stem {
  text: string;
  assets?: string[];
  variables?: Record<string, VariableSpec>;
}

export interface Taxonomy {
  concepts: string[];
  skills: string[];
  difficulty: 'E' | 'M' | 'H'; // Easy, Medium, Hard
}

export interface Option {
  id: string;
  text: string;
  correct: boolean;
  distractorType?: string;
  feedback?: string;
  nextStep?: string;
}

export interface Step {
  id: string;
  type: 'read' | 'extract' | 'question' | 'relation' | 'plan' | 'compute' | 'check';
  prompt: string;
  options: Option[];
  multipleSelect?: boolean;
  hints?: string[];
  validation?: {
    unit?: string;
    mustUseConditions?: string[];
  };
  telemetryKeys?: string[];
}

export interface Transition {
  fromStep: string;
  onWrong: string;
  onCorrect: string;
  maxRetries: number;
}

export interface ScoringRule {
  score: number;
  penaltyPerRetry?: number;
  minScore?: number;
  timeBonus?: number;
}

export interface Scoring {
  total: number;
  perStep: Record<string, ScoringRule>;
}

export interface Answer {
  final: string;
  unit: string;
  rationale: string;
}

export interface Item {
  id: string;
  stem: Stem;
  taxonomy: Taxonomy;
  steps: Step[];
  transitions: Transition[];
  scoring: Scoring;
  answer: Answer;
}

export interface Metadata {
  gradeBand: string;
  subject: string;
  tags: string[];
  createdAt: string;
  author: string;
}

export interface ProblemSet {
  $schema?: string;
  id: string;
  version: string;
  locale: 'zh-CN';
  metadata: Metadata;
  items: Item[];
}

export interface TelemetryEntry {
  t: number; // timestamp
  stepId?: string;
  correct?: boolean;
  selection?: string[];
  retries?: number;
  elapsed?: number;
  done?: boolean;
  totalScore?: number;
}

export interface AppState {
  itemIdx: number;
  stepIdx: number;
  vars: Record<string, number>;
  retries: Record<string, number>;
  score: number;
  startTime: number;
  stepStart: number;
  path: TelemetryEntry[];
  currentItem?: Item;
}