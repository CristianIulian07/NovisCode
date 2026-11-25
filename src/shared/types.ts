export type SelectedLanguage = 'c' | 'cpp' | 'python' | 'javascript' | 'html_css';

export type DetectedLanguage = SelectedLanguage | 'unsupported' | 'empty';

export const LANGUAGE_LABELS: Record<SelectedLanguage, string> = {
  c: 'C',
  cpp: 'C++',
  python: 'Python',
  javascript: 'JavaScript',
  html_css: 'HTML/CSS',
};

export type VerdictLevel = 'needs_work' | 'decent' | 'solid';

export type IssueCategory =
  | 'bug'
  | 'security'
  | 'performance'
  | 'readability'
  | 'best_practice'
  | 'accessibility';

export type IssueSeverity = 'critical' | 'important' | 'minor';

export interface ReviewVerdict {
  level: VerdictLevel;
  one_line: string;
}

export interface ReviewIssue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  line_start: number;
  line_end: number;
  title: string;
  why_it_matters: string;
  how_to_fix: string;
  fixed_snippet: string;
  concept_to_learn: string;
}

export interface ReviewResponse {
  detected_language: DetectedLanguage;
  verdict: ReviewVerdict;
  strengths: string[];
  issues: ReviewIssue[];
  top_priorities: string[];
  mentor_note: string;
}

export interface ReviewRequestBody {
  code: string;
  language: SelectedLanguage;
}

export interface ReviewErrorResponse {
  error: string;
  code: string;
}

export interface HealthStatusResponse {
  ok: boolean;
  apiKeyConfigured: boolean;
  model: string;
}

export interface ReviewHistoryEntry {
  id: string;
  createdAt: string;
  language: SelectedLanguage;
  code: string;
  review: ReviewResponse;
}
