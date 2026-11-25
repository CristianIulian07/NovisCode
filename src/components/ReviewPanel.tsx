import { AlertCircle, CheckCircle2, Download, RotateCw } from 'lucide-react';
import {
  formatReviewAsMarkdown,
  getLanguageMismatchNotice,
} from '../shared/reviewLogic';
import type {
  ReviewIssue,
  ReviewResponse,
  SelectedLanguage,
  VerdictLevel,
} from '../shared/types';
import { IssueCard } from './IssueCard';
import { ReviewSkeleton } from './ReviewSkeleton';

export type ReviewStatus = 'empty' | 'loading' | 'error' | 'success';

interface ReviewPanelProps {
  status: ReviewStatus;
  review: ReviewResponse | null;
  errorMessage: string | null;
  selectedLanguage: SelectedLanguage;
  selectedIssueId: string | null;
  onSelectIssue: (issue: ReviewIssue) => void;
  onPriorityClick: (issue: ReviewIssue) => void;
  onApplySnippet: (issue: ReviewIssue) => void;
  onRetry: () => void;
}

const VERDICT_META: Record<VerdictLevel, { label: string; badgeClass: string }> = {
  needs_work: {
    label: 'Necesită îmbunătățiri',
    badgeClass: 'bg-[#331518] text-[#FCA5A5] border-[#7F1D1D]',
  },
  decent: {
    label: 'Bază bună, cu scăpări',
    badgeClass: 'bg-[#2E2312] text-[#FCD34D] border-[#78350F]',
  },
  solid: {
    label: 'Cod solid',
    badgeClass: 'bg-[#122A1E] text-[#86EFAC] border-[#166534]',
  },
};

export function ReviewPanel({
  status,
  review,
  errorMessage,
  selectedLanguage,
  selectedIssueId,
  onSelectIssue,
  onPriorityClick,
  onApplySnippet,
  onRetry,
}: ReviewPanelProps) {
  if (status === 'empty') {
    return (
      <div
        data-testid="review-empty"
        className="rounded-lg border border-[#262A33] bg-[#14161B] p-6 space-y-2"
      >
        <h2 className="text-sm font-semibold text-[#ECEEF2]">
          Pregătit pentru code review
        </h2>
        <p className="text-sm text-[#A1A8B8] leading-relaxed">
          Alege limbajul (C, C++, Python, JavaScript sau HTML/CSS), lipește codul tău sau încarcă un exemplu din stânga, apoi apasă «Analizează codul».
        </p>
      </div>
    );
  }

  if (status === 'loading') {
    return <ReviewSkeleton />;
  }

  if (status === 'error') {
    return (
      <div
        role="alert"
        data-testid="review-error"
        className="rounded-lg border border-[#7F1D1D] bg-[#1F1215] p-5 space-y-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-[#FCA5A5] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[#FCA5A5]">
              Analiza nu a putut fi finalizată
            </h2>
            <p className="text-sm text-[#E5D3D6] leading-relaxed">
              {errorMessage ?? 'A apărut o eroare neașteptată. Încearcă din nou.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-md border border-[#FCA5A5]/40 bg-[#331518] px-4 py-2 text-sm font-medium text-[#FCA5A5] hover:bg-[#451A1F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] cursor-pointer whitespace-nowrap"
        >
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          <span>Încearcă din nou</span>
        </button>
      </div>
    );
  }

  if (!review) {
    return null;
  }

  const mismatchNotice = getLanguageMismatchNotice(
    selectedLanguage,
    review.detected_language,
  );
  const isUnsupportedOrEmpty =
    review.detected_language === 'unsupported' || review.detected_language === 'empty';

  const verdictMeta = VERDICT_META[review.verdict.level];
  const issueById = new Map(review.issues.map((issue) => [issue.id, issue]));
  const priorityIssues = review.top_priorities
    .map((id) => issueById.get(id))
    .filter((item): item is ReviewIssue => Boolean(item))
    .slice(0, 3);

  const handleExportMarkdown = () => {
    const markdown = formatReviewAsMarkdown(review, selectedLanguage);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `noviscode-review-${selectedLanguage}-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div data-testid="review-result" className="space-y-5">
      {mismatchNotice && (
        <div
          role="status"
          data-testid="language-mismatch-notice"
          className="rounded-lg border border-[#78350F] bg-[#241C0F] px-4 py-3 text-sm text-[#FDE68A]"
        >
          {mismatchNotice}
        </div>
      )}

      {isUnsupportedOrEmpty ? (
        <div
          data-testid="unsupported-notice"
          className="rounded-lg border border-[#262A33] bg-[#14161B] p-5 space-y-2"
        >
          <h2 className="text-base font-semibold text-[#ECEEF2]">
            {review.detected_language === 'empty'
              ? 'Nu există cod de analizat'
              : 'Limbaj nesuportat'}
          </h2>
          <p className="text-sm text-[#D4D8E1] leading-relaxed">{review.mentor_note}</p>
        </div>
      ) : (
        <>
          {/* 1. Verdict */}
          <section
            aria-labelledby="verdict-heading"
            className="rounded-lg border border-[#262A33] bg-[#14161B] p-4 space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <h2 id="verdict-heading" className="sr-only">
                  Verdict
                </h2>
                <span
                  data-testid="verdict-badge"
                  className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${verdictMeta.badgeClass}`}
                >
                  {verdictMeta.label}
                </span>
              </div>

              <button
                type="button"
                onClick={handleExportMarkdown}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#262A33] bg-[#191C22] px-2.5 py-1 text-xs font-medium text-[#CBD5E1] hover:border-[#38BDF8] hover:text-[#FFFFFF] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Exportă .md</span>
              </button>
            </div>
            <p className="text-base font-medium text-[#ECEEF2] leading-snug">
              {review.verdict.one_line}
            </p>
          </section>

          {/* 2. Ce ai făcut bine */}
          <section
            aria-labelledby="strengths-heading"
            className="rounded-lg border border-[#262A33] bg-[#14161B] p-4 space-y-2.5"
          >
            <h2 id="strengths-heading" className="text-sm font-semibold text-[#ECEEF2]">
              Ce ai făcut bine
            </h2>
            {review.strengths.length > 0 ? (
              <ul className="space-y-1.5 text-sm text-[#D4D8E1]">
                {review.strengths.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2
                      className="h-4 w-4 text-[#86EFAC] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#94A3B8]">
                Nu s-a remarcat încă un punct forte distinct în acest fragment.
              </p>
            )}
          </section>

          {/* 3. Top priorities */}
          {priorityIssues.length > 0 && (
            <section aria-labelledby="priorities-heading" className="space-y-2.5">
              <h2 id="priorities-heading" className="text-sm font-semibold text-[#ECEEF2]">
                Priorități principale
              </h2>
              <div className="flex flex-wrap gap-2">
                {priorityIssues.map((issue, index) => (
                  <button
                    key={issue.id}
                    type="button"
                    data-testid="priority-chip"
                    onClick={() => onPriorityClick(issue)}
                    className="inline-flex items-center gap-2 rounded-md border border-[#2E3440] bg-[#191C22] px-3 py-2 text-left text-xs font-medium text-[#ECEEF2] hover:border-[#38BDF8] hover:text-[#FFFFFF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] cursor-pointer"
                  >
                    <span className="font-mono tabular-nums text-[#38BDF8] font-semibold">
                      {index + 1}.
                    </span>
                    <span className="truncate max-w-[240px]">{issue.title}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 4. Issue cards */}
          <section aria-labelledby="issues-heading" className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="issues-heading" className="text-sm font-semibold text-[#ECEEF2]">
                Observații detaliate
              </h2>
              <span className="text-xs font-mono tabular-nums text-[#94A3B8]">
                {review.issues.length}{' '}
                {review.issues.length === 1 ? 'problemă' : 'probleme'}
              </span>
            </div>

            {review.issues.length > 0 ? (
              <div className="space-y-3">
                {review.issues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    isSelected={selectedIssueId === issue.id}
                    onSelect={onSelectIssue}
                    onApplySnippet={onApplySnippet}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-[#262A33] bg-[#14161B] p-4 text-sm text-[#D4D8E1]">
                Nu au fost identificate probleme concrete în acest fragment de cod.
              </div>
            )}
          </section>

          {/* 5. Mentor note */}
          <section
            aria-labelledby="mentor-note-heading"
            className="rounded-lg border border-[#262A33] bg-[#14161B] p-4 space-y-1.5"
          >
            <h2 id="mentor-note-heading" className="text-sm font-semibold text-[#ECEEF2]">
              Notă de mentor
            </h2>
            <p className="text-sm text-[#D4D8E1] leading-relaxed">{review.mentor_note}</p>
          </section>
        </>
      )}
    </div>
  );
}
