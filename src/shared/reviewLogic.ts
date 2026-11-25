import {
  LANGUAGE_LABELS,
  type DetectedLanguage,
  type IssueCategory,
  type IssueSeverity,
  type ReviewIssue,
  type ReviewResponse,
  type SelectedLanguage,
  type VerdictLevel,
} from './types';

export const MAX_CODE_CHARS = 8000;

export const SUPPORTED_LANGUAGES: readonly SelectedLanguage[] = [
  'c',
  'cpp',
  'python',
  'javascript',
  'html_css',
];

const VALID_SELECTED_LANGUAGES = new Set<SelectedLanguage>(SUPPORTED_LANGUAGES);

const VALID_DETECTED_LANGUAGES = new Set<DetectedLanguage>([
  ...SUPPORTED_LANGUAGES,
  'unsupported',
  'empty',
]);

const VALID_VERDICT_LEVELS = new Set<VerdictLevel>(['needs_work', 'decent', 'solid']);

const VALID_CATEGORIES = new Set<IssueCategory>([
  'bug',
  'security',
  'performance',
  'readability',
  'best_practice',
  'accessibility',
]);

const VALID_SEVERITIES = new Set<IssueSeverity>(['critical', 'important', 'minor']);

const SEVERITY_ORDER: Record<IssueSeverity, number> = {
  critical: 0,
  important: 1,
  minor: 2,
};

export class MalformedReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MalformedReviewError';
  }
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  charCount: number;
}

export function isSelectedLanguage(value: unknown): value is SelectedLanguage {
  return typeof value === 'string' && VALID_SELECTED_LANGUAGES.has(value as SelectedLanguage);
}

export function validateCodeInput(code: string): ValidationResult {
  const charCount = code.length;
  if (code.trim().length === 0) {
    return {
      valid: false,
      error: 'Introdu sau lipește un fragment de cod înainte de a porni analiza.',
      charCount,
    };
  }
  if (charCount > MAX_CODE_CHARS) {
    return {
      valid: false,
      error: `Codul depășește limita de ${MAX_CODE_CHARS.toLocaleString('ro-RO')} de caractere (are ${charCount.toLocaleString('ro-RO')}). Scurtează fragmentul și încearcă din nou.`,
      charCount,
    };
  }
  return { valid: true, charCount };
}

export function countLines(code: string): number {
  if (code.length === 0) return 0;
  return code.split(/\r?\n/).length;
}

export function prependLineNumbers(code: string): string {
  const lines = code.split(/\r?\n/);
  return lines.map((line, index) => `${index + 1}| ${line}`).join('\n');
}

export function sortIssuesBySeverity(issues: ReviewIssue[]): ReviewIssue[] {
  return [...issues].sort((a, b) => {
    const severityDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return a.line_start - b.line_start;
  });
}

function stripMarkdownFences(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*\r?\n([\s\S]*?)\r?\n```$/i);
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim();
  }
  return trimmed;
}

function clampLineNumber(value: unknown, totalLines: number): number {
  const maxLine = Math.max(1, totalLines);
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 1;
  }
  const rounded = Math.trunc(value);
  return Math.min(Math.max(1, rounded), maxLine);
}

function asNonEmptyString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

export function parseReviewResponse(rawText: string, totalLines: number): ReviewResponse {
  if (typeof rawText !== 'string' || rawText.trim().length === 0) {
    throw new MalformedReviewError('Modelul a returnat un răspuns gol.');
  }

  const cleaned = stripMarkdownFences(rawText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new MalformedReviewError('Răspunsul primit nu este un JSON valid.');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new MalformedReviewError('Structura JSON a analizei este invalidă.');
  }

  const record = parsed as Record<string, unknown>;

  const rawLang = record.detected_language;
  if (typeof rawLang !== 'string' || !VALID_DETECTED_LANGUAGES.has(rawLang as DetectedLanguage)) {
    throw new MalformedReviewError('Limbajul detectat lipsește sau este invalid.');
  }
  const detected_language = rawLang as DetectedLanguage;

  const rawVerdict = record.verdict;
  if (typeof rawVerdict !== 'object' || rawVerdict === null || Array.isArray(rawVerdict)) {
    throw new MalformedReviewError('Verdictul lipsește din răspunsul analizei.');
  }
  const verdictObj = rawVerdict as Record<string, unknown>;
  const rawLevel = verdictObj.level;
  const level: VerdictLevel =
    typeof rawLevel === 'string' && VALID_VERDICT_LEVELS.has(rawLevel as VerdictLevel)
      ? (rawLevel as VerdictLevel)
      : 'needs_work';
  const one_line = asNonEmptyString(verdictObj.one_line);
  if (!one_line) {
    throw new MalformedReviewError('Rezumatul verdictului lipsește.');
  }

  const rawStrengths = Array.isArray(record.strengths) ? record.strengths : [];
  const strengths = rawStrengths
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, 3);

  if (!Array.isArray(record.issues)) {
    throw new MalformedReviewError('Lista de observații lipsește din răspuns.');
  }

  const normalizedIssues: ReviewIssue[] = [];
  for (let i = 0; i < record.issues.length && normalizedIssues.length < 8; i++) {
    const rawIssue = record.issues[i];
    if (typeof rawIssue !== 'object' || rawIssue === null || Array.isArray(rawIssue)) {
      continue;
    }
    const issue = rawIssue as Record<string, unknown>;
    const title = asNonEmptyString(issue.title);
    const why_it_matters = asNonEmptyString(issue.why_it_matters);
    const how_to_fix = asNonEmptyString(issue.how_to_fix);
    if (!title || !why_it_matters || !how_to_fix) {
      continue;
    }

    const lineStart = clampLineNumber(issue.line_start, totalLines);
    const lineEnd = Math.max(lineStart, clampLineNumber(issue.line_end, totalLines));

    const category: IssueCategory =
      typeof issue.category === 'string' && VALID_CATEGORIES.has(issue.category as IssueCategory)
        ? (issue.category as IssueCategory)
        : 'best_practice';

    const severity: IssueSeverity =
      typeof issue.severity === 'string' && VALID_SEVERITIES.has(issue.severity as IssueSeverity)
        ? (issue.severity as IssueSeverity)
        : 'important';

    const id = asNonEmptyString(issue.id) || `issue-${i + 1}`;
    const fixed_snippet = typeof issue.fixed_snippet === 'string' ? issue.fixed_snippet.trimEnd() : '';
    const concept_to_learn = asNonEmptyString(issue.concept_to_learn, 'fundamente');

    normalizedIssues.push({
      id,
      category,
      severity,
      line_start: lineStart,
      line_end: lineEnd,
      title,
      why_it_matters,
      how_to_fix,
      fixed_snippet,
      concept_to_learn,
    });
  }

  const sortedIssues = sortIssuesBySeverity(normalizedIssues);
  const validIssueIds = new Set(sortedIssues.map((issue) => issue.id));

  const rawPriorities = Array.isArray(record.top_priorities) ? record.top_priorities : [];
  const top_priorities: string[] = [];
  for (const item of rawPriorities) {
    if (
      typeof item === 'string' &&
      validIssueIds.has(item) &&
      !top_priorities.includes(item) &&
      top_priorities.length < 3
    ) {
      top_priorities.push(item);
    }
  }

  const mentor_note = asNonEmptyString(record.mentor_note);
  if (!mentor_note) {
    throw new MalformedReviewError('Nota mentorului lipsește din răspuns.');
  }

  return {
    detected_language,
    verdict: {
      level,
      one_line,
    },
    strengths,
    issues: sortedIssues,
    top_priorities,
    mentor_note,
  };
}

export function getLanguageMismatchNotice(
  selected: SelectedLanguage,
  detected: DetectedLanguage,
): string | null {
  if (detected === 'empty' || detected === 'unsupported' || detected === selected) {
    return null;
  }
  const detectedLabel = LANGUAGE_LABELS[detected];
  const selectedLabel = LANGUAGE_LABELS[selected];
  return `Ai selectat ${selectedLabel}, dar codul pare să fie scris în ${detectedLabel}. Analiza a fost adaptată automat pentru ${detectedLabel}.`;
}

export function applySnippetToCode(
  code: string,
  lineStart: number,
  lineEnd: number,
  snippet: string,
): string {
  if (!snippet.trim()) {
    return code;
  }
  const lines = code.split(/\r?\n/);
  const total = Math.max(1, lines.length);
  const startIdx = Math.min(Math.max(1, Math.trunc(lineStart)), total) - 1;
  const endIdx = Math.min(Math.max(startIdx + 1, Math.trunc(lineEnd)), total) - 1;
  const replacementLines = snippet.replace(/\r\n/g, '\n').split('\n');
  const nextLines = [
    ...lines.slice(0, startIdx),
    ...replacementLines,
    ...lines.slice(endIdx + 1),
  ];
  return nextLines.join('\n');
}

export function formatReviewAsMarkdown(
  review: ReviewResponse,
  language: SelectedLanguage,
): string {
  const langName =
    review.detected_language !== 'empty' && review.detected_language !== 'unsupported'
      ? LANGUAGE_LABELS[review.detected_language]
      : LANGUAGE_LABELS[language];

  const lines: string[] = [
    `# Raport Code Review — NovisCode (${langName})`,
    '',
    `**Verdict:** ${review.verdict.one_line}`,
    '',
  ];

  if (review.strengths.length > 0) {
    lines.push('## Ce ai făcut bine');
    for (const s of review.strengths) {
      lines.push(`- ${s}`);
    }
    lines.push('');
  }

  if (review.issues.length > 0) {
    lines.push(`## Observații detaliate (${review.issues.length})`);
    lines.push('');
    for (const issue of review.issues) {
      const range =
        issue.line_start === issue.line_end
          ? `Linia ${issue.line_start}`
          : `Liniile ${issue.line_start}–${issue.line_end}`;
      lines.push(`### [${issue.severity.toUpperCase()}] ${issue.title} (${range})`);
      lines.push(`- **De ce contează:** ${issue.why_it_matters}`);
      lines.push(`- **Cum repari:** ${issue.how_to_fix}`);
      lines.push(`- **Concept de aprofundat:** \`${issue.concept_to_learn}\``);
      if (issue.fixed_snippet) {
        lines.push('', '```', issue.fixed_snippet, '```');
      }
      lines.push('');
    }
  }

  lines.push('## Notă de mentor', '', review.mentor_note, '');
  return lines.join('\n');
}
