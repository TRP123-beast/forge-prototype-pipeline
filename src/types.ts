/**
 * Core types used across the prototype pipeline.
 *
 * NOTE: Update FeatureSpec to match Dev A's actual output format once
 * Task 1.2 is complete. The current shape is a starting point based on
 * the Phase 1 Dev Spec, Step 2 output. Until then, the parser/loader
 * for spec files only needs to read raw markdown — these types describe
 * the structured form we expect to migrate to.
 */

export interface Flow {
  name: string;
  steps: string[];
}

export interface ScreenSpec {
  name: string;
  route: string;
  states: string[];
  description: string;
}

export interface FeatureSpec {
  title: string;
  summary: string;
  stakeholders: string[];
  flows: Flow[];
  edgeCases: string[];
  dataRequirements: string[];
  screens: ScreenSpec[];
  openQuestions: string[];
}

export interface GeneratedFile {
  path: string;
  contents: string;
}

export interface RunMeta {
  runId: string;
  timestamp: string;
  model: string;
  promptVersion: string;
  specPath: string;
  deployedUrl?: string;
  buildDurationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
}
