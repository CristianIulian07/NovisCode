import { useCallback, useEffect, useRef, useState } from 'react';
import { Code2, History, Sparkles, Trash2, AlertTriangle } from 'lucide-react';
import { CODE_EXAMPLES } from './data/examples';
import { CodeEditor, type HighlightRange } from './components/CodeEditor';
import { ReviewPanel, type ReviewStatus } from './components/ReviewPanel';
import {
  MAX_CODE_CHARS,
  SUPPORTED_LANGUAGES,
  applySnippetToCode,
  validateCodeInput,
} from './shared/reviewLogic';
import {
  LANGUAGE_LABELS,
  type HealthStatusResponse,
  type ReviewErrorResponse,
  type ReviewHistoryEntry,
  type ReviewIssue,
  type ReviewResponse,
  type SelectedLanguage,
} from './shared/types';

const HISTORY_STORAGE_KEY = 'noviscode_review_history_v1';
const MAX_HISTORY_ITEMS = 10;

function loadHistory(): ReviewHistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: ReviewHistoryEntry[]): void {
  try {
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_HISTORY_ITEMS)),
    );
  } catch {
    // Ignore storage quota errors
  }
}

export default function App() {
  const [language, setLanguage] = useState<SelectedLanguage>('c');
  const [code, setCode] = useState<string>('');
  const [status, setStatus] = useState<ReviewStatus>('empty');
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [highlightedRange, setHighlightedRange] = useState<HighlightRange | null>(null);
  const [history, setHistory] = useState<ReviewHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [apiHealth, setApiHealth] = useState<HealthStatusResponse | null>(null);

  const highlightNonceRef = useRef(0);
  const resultsColumnRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: HealthStatusResponse | null) => {
        if (data) setApiHealth(data);
      })
      .catch(() => {
        // Ignore initial health check error
      });
  }, []);

  const validation = validateCodeInput(code);
  const isOverLimit = validation.charCount > MAX_CODE_CHARS;
  const isEmpty = code.trim().length === 0;
  const showValidationError =
    isOverLimit || (validationAttempted && !validation.valid);
  const canSubmit = status !== 'loading' && validation.valid;

  const submitReview = useCallback(async () => {
    const check = validateCodeInput(code);
    if (!check.valid) {
      setValidationAttempted(true);
      return;
    }

    setValidationAttempted(false);
    setStatus('loading');
    setErrorMessage(null);
    setSelectedIssueId(null);
    setHighlightedRange(null);

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      const rawBody = await response.text();
      let parsedBody: unknown = null;
      try {
        parsedBody = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        parsedBody = null;
      }

      if (!response.ok) {
        const apiErr = parsedBody as ReviewErrorResponse | null;
        throw new Error(
          apiErr?.error ||
            'Serviciul a returnat o eroare neașteptată. Încearcă din nou.',
        );
      }

      if (!parsedBody || typeof parsedBody !== 'object') {
        throw new Error(
          'Răspunsul primit de la server nu este valid. Încearcă din nou.',
        );
      }

      const parsedReview = parsedBody as ReviewResponse;
      setReview(parsedReview);
      setStatus('success');

      const newEntry: ReviewHistoryEntry = {
        id: `rev-${Date.now()}`,
        createdAt: new Date().toLocaleString('ro-RO', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        language,
        code,
        review: parsedReview,
      };
      setHistory((prev) => {
        const next = [newEntry, ...prev].slice(0, MAX_HISTORY_ITEMS);
        saveHistory(next);
        return next;
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Conexiunea cu serverul a eșuat. Verifică rețeaua și încearcă din nou.';
      setErrorMessage(message);
      setStatus('error');
    }
  }, [code, language]);

  const handleLoadExample = (exampleLang: SelectedLanguage) => {
    setLanguage(exampleLang);
    setCode(CODE_EXAMPLES[exampleLang].code);
    setValidationAttempted(false);
    setSelectedIssueId(null);
    setHighlightedRange(null);
  };

  const handleCodeChange = (nextCode: string) => {
    setCode(nextCode);
    if (selectedIssueId) {
      setSelectedIssueId(null);
    }
    if (highlightedRange) {
      setHighlightedRange(null);
    }
  };

  const highlightIssueLines = (issue: ReviewIssue) => {
    highlightNonceRef.current += 1;
    setSelectedIssueId(issue.id);
    setHighlightedRange({
      start: issue.line_start,
      end: issue.line_end,
      nonce: highlightNonceRef.current,
    });
  };

  const handlePriorityClick = (issue: ReviewIssue) => {
    highlightIssueLines(issue);
    const cardElement = document.getElementById(`issue-${issue.id}`);
    if (cardElement) {
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleApplySnippet = (issue: ReviewIssue) => {
    const updatedCode = applySnippetToCode(
      code,
      issue.line_start,
      issue.line_end,
      issue.fixed_snippet,
    );
    setCode(updatedCode);
    const snippetLineCount = issue.fixed_snippet.split(/\r?\n/).length;
    highlightNonceRef.current += 1;
    setHighlightedRange({
      start: issue.line_start,
      end: issue.line_start + Math.max(0, snippetLineCount - 1),
      nonce: highlightNonceRef.current,
    });
  };

  const handleRestoreHistory = (entry: ReviewHistoryEntry) => {
    setLanguage(entry.language);
    setCode(entry.code);
    setReview(entry.review);
    setStatus('success');
    setErrorMessage(null);
    setSelectedIssueId(null);
    setHighlightedRange(null);
    setShowHistory(false);
  };

  const handleClearHistory = () => {
    setHistory([]);
    saveHistory([]);
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-[#0D0E11] text-[#ECEEF2] flex flex-col">
      <header className="border-b border-[#22262F] bg-[#0D0E11]">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#162334] border border-[#244060] flex items-center justify-center text-[#38BDF8]">
              <Code2 className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#ECEEF2] whitespace-nowrap leading-none">
                NovisCode
              </h1>
              <p className="hidden sm:block text-[11px] text-[#94A3B8] mt-0.5">
                AI Code Mentor pentru studenți și programatori la început de drum
              </p>
            </div>
          </div>

          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              aria-expanded={showHistory}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#262A33] bg-[#14161B] px-3 py-1.5 text-xs font-medium text-[#CBD5E1] hover:border-[#363C49] hover:text-[#FFFFFF] transition-colors cursor-pointer whitespace-nowrap"
            >
              <History className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
              <span>Istoric ({history.length})</span>
            </button>

            {showHistory && (
              <div className="absolute right-0 top-10 z-30 w-80 sm:w-96 rounded-lg border border-[#262A33] bg-[#14161B] shadow-2xl p-3 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-[#22262F]">
                  <span className="text-xs font-semibold text-[#ECEEF2]">
                    Ultimele analize salvate local
                  </span>
                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="inline-flex items-center gap-1 text-xs text-[#FCA5A5] hover:underline cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                      <span>Șterge tot</span>
                    </button>
                  )}
                </div>

                {history.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] py-3 text-center">
                    Niciun review salvat încă. Analizează un fragment de cod și va apărea aici.
                  </p>
                ) : (
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#22262F]">
                    {history.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => handleRestoreHistory(entry)}
                        className="w-full py-2.5 px-2 text-left hover:bg-[#191C24] rounded transition-colors cursor-pointer space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                          <span className="font-semibold text-[#7DD3FC]">
                            {LANGUAGE_LABELS[entry.language]}
                          </span>
                          <span className="font-mono">{entry.createdAt}</span>
                        </div>
                        <p className="text-xs text-[#ECEEF2] line-clamp-1">
                          {entry.review.verdict.one_line}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {apiHealth && !apiHealth.apiKeyConfigured && (
        <div className="border-b border-[#78350F] bg-[#241C0F] px-4 sm:px-6 py-2.5">
          <div className="mx-auto max-w-[1400px] flex items-center gap-2.5 text-xs text-[#FDE68A]">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#FCD34D]" aria-hidden="true" />
            <span>
              <strong>GEMINI_API_KEY</strong> nu este configurată încă pe server. Creează un fișier{' '}
              <code className="rounded bg-[#14161B] px-1.5 py-0.5 text-[#ECEEF2]">.env</code> în rădăcina proiectului cu{' '}
              <code className="rounded bg-[#14161B] px-1.5 py-0.5 text-[#ECEEF2]">GEMINI_API_KEY=cheia_ta</code> și repornește aplicația.
            </span>
          </div>
        </div>
      )}

      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-5 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left column: Code editor */}
          <section aria-label="Editor de cod și controale" className="space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Language segmented control */}
              <div
                role="group"
                aria-label="Selectează limbajul"
                className="inline-flex flex-wrap items-center rounded-lg border border-[#262A33] bg-[#14161B] p-1 gap-0.5"
              >
                {SUPPORTED_LANGUAGES.map((langKey) => (
                  <button
                    key={langKey}
                    type="button"
                    onClick={() => setLanguage(langKey)}
                    aria-pressed={language === langKey}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] cursor-pointer whitespace-nowrap ${
                      language === langKey
                        ? 'bg-[#232732] text-[#FFFFFF]'
                        : 'text-[#94A3B8] hover:text-[#ECEEF2]'
                    }`}
                  >
                    {LANGUAGE_LABELS[langKey]}
                  </button>
                ))}
              </div>

              {/* Active language example loader */}
              <button
                type="button"
                onClick={() => handleLoadExample(language)}
                disabled={status === 'loading'}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#262A33] bg-[#14161B] px-3 py-1.5 text-xs font-medium text-[#CBD5E1] hover:border-[#38BDF8] hover:text-[#FFFFFF] disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
                <span>{CODE_EXAMPLES[language].buttonLabel}</span>
              </button>
            </div>

            <CodeEditor
              value={code}
              onChange={handleCodeChange}
              language={language}
              highlightedRange={highlightedRange}
              onSubmit={submitReview}
              disabled={status === 'loading'}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
              <div className="space-y-1">
                <p
                  data-testid="char-counter"
                  className={`text-xs font-mono tabular-nums ${
                    isOverLimit ? 'text-[#FCA5A5] font-semibold' : 'text-[#94A3B8]'
                  }`}
                >
                  {validation.charCount.toLocaleString('ro-RO')} /{' '}
                  {MAX_CODE_CHARS.toLocaleString('ro-RO')} caractere
                </p>
                {showValidationError && validation.error && (
                  <p
                    role="alert"
                    data-testid="validation-error"
                    className="text-xs text-[#FCA5A5] leading-snug"
                  >
                    {validation.error}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={submitReview}
                disabled={!canSubmit}
                aria-disabled={!canSubmit}
                title={
                  isEmpty
                    ? 'Introdu cod pentru a activa analiza'
                    : isOverLimit
                      ? 'Codul depășește limita de 8.000 de caractere'
                      : 'Analizează codul (Ctrl+Enter)'
                }
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#38BDF8] px-5 py-2.5 text-sm font-semibold text-[#090B0E] hover:bg-[#7DD3FC] disabled:bg-[#1E242E] disabled:text-[#64748B] disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0E11] cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>{status === 'loading' ? 'Se analizează...' : 'Analizează codul'}</span>
                <kbd className="hidden sm:inline-block rounded bg-[#090B0E]/15 px-1.5 py-0.5 text-[11px] font-mono font-medium">
                  Ctrl+Enter
                </kbd>
              </button>
            </div>
          </section>

          {/* Right column: Review results */}
          <section
            ref={resultsColumnRef}
            aria-label="Rezultatul analizei"
            className="lg:max-h-[calc(100vh-7.5rem)] lg:overflow-y-auto lg:pr-1"
          >
            <ReviewPanel
              status={status}
              review={review}
              errorMessage={errorMessage}
              selectedLanguage={language}
              selectedIssueId={selectedIssueId}
              onSelectIssue={highlightIssueLines}
              onPriorityClick={handlePriorityClick}
              onApplySnippet={handleApplySnippet}
              onRetry={submitReview}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
