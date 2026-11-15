export type SelectedLanguage = 'html_css' | 'cpp';

export type DetectedLanguage = 'html_css' | 'cpp' | 'unsupported' | 'empty';

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
