import { useState } from 'react';
import { AlertOctagon, AlertTriangle, Check, Copy, Info } from 'lucide-react';
import type { IssueCategory, IssueSeverity, ReviewIssue } from '../shared/types';

interface IssueCardProps {
  issue: ReviewIssue;
  isSelected: boolean;
  onSelect: (issue: ReviewIssue) => void;
}

const SEVERITY_META: Record<
  IssueSeverity,
  {
    label: string;
    badgeClass: string;
    Icon: typeof AlertOctagon;
  }
> = {
  critical: {
    label: 'Critic',
    badgeClass: 'bg-[#331518] text-[#FCA5A5] border-[#7F1D1D]',
    Icon: AlertOctagon,
  },
  important: {
    label: 'Important',
    badgeClass: 'bg-[#2E2312] text-[#FCD34D] border-[#78350F]',
    Icon: AlertTriangle,
  },
  minor: {
    label: 'Minor',
    badgeClass: 'bg-[#142238] text-[#93C5FD] border-[#1E3A8A]',
    Icon: Info,
  },
};

const CATEGORY_LABELS: Record<IssueCategory, string> = {
  bug: 'Eroare',
  security: 'Securitate',
  performance: 'Performanță',
  readability: 'Lizibilitate',
  best_practice: 'Bune practici',
  accessibility: 'Accesibilitate',
};

function formatLineRange(start: number, end: number): string {
  if (start === end) {
    return `Linia ${start}`;
  }
  return `Liniile ${start}–${end}`;
}

export function IssueCard({ issue, isSelected, onSelect }: IssueCardProps) {
  const [copied, setCopied] = useState(false);
  const severity = SEVERITY_META[issue.severity];
  const SeverityIcon = severity.Icon;
  const lineLabel = formatLineRange(issue.line_start, issue.line_end);

  const handleCopy = async () => {
    if (!issue.fixed_snippet) return;
    try {
      await navigator.clipboard.writeText(issue.fixed_snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article
      id={`issue-${issue.id}`}
      data-testid="issue-card"
      data-severity={issue.severity}
      className={`rounded-lg border transition-colors duration-150 ${
        isSelected
          ? 'border-[#38BDF8] bg-[#171A21]'
          : 'border-[#262A33] bg-[#14161B] hover:border-[#363C49]'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(issue)}
        aria-pressed={isSelected}
        aria-label={`Evidențiază în editor: ${issue.title}, ${lineLabel}`}
        className="w-full text-left p-4 pb-3 rounded-t-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-inset cursor-pointer"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${severity.badgeClass}`}
            >
              <SeverityIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{severity.label}</span>
            </span>
            <span className="text-xs font-medium text-[#A1A8B8]">
              {CATEGORY_LABELS[issue.category]}
            </span>
          </div>
          <span className="text-xs font-mono tabular-nums text-[#94A3B8]">
            {lineLabel}
          </span>
        </div>

        <h3 className="text-base font-semibold text-[#ECEEF2] leading-snug mb-3">
          {issue.title}
        </h3>

        <div className="space-y-2.5 text-sm leading-relaxed">
          <div>
            <p className="text-xs font-semibold text-[#94A3B8] mb-0.5">
              De ce contează
            </p>
            <p className="text-[#D4D8E1]">{issue.why_it_matters}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#94A3B8] mb-0.5">
              Cum îl repari
            </p>
            <p className="text-[#D4D8E1]">{issue.how_to_fix}</p>
          </div>
        </div>
      </button>

      <div className="px-4 pb-4 space-y-3">
        {issue.fixed_snippet && (
          <div className="rounded-md border border-[#22262F] bg-[#111318] overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-[#22262F] bg-[#151820]">
              <span className="text-xs font-medium text-[#94A3B8]">
                Variantă corectată
              </span>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={`Copiază codul corectat pentru ${issue.title}`}
                className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-[#CBD5E1] hover:text-[#FFFFFF] hover:bg-[#22262F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] cursor-pointer whitespace-nowrap shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#86EFAC]" aria-hidden="true" />
                    <span className="text-[#86EFAC]">Copiat</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copiază</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 text-xs leading-relaxed text-[#E2E8F0] overflow-x-auto font-mono">
              <code>{issue.fixed_snippet}</code>
            </pre>
          </div>
        )}

        <p className="text-xs text-[#94A3B8]">
          <span className="font-semibold text-[#A1A8B8]">De căutat:</span>{' '}
          <span className="text-[#CBD5E1]">{issue.concept_to_learn}</span>
        </p>
      </div>
    </article>
  );
}
