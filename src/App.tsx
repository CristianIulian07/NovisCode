import { useCallback, useRef, useState } from 'react';
import { CODE_EXAMPLES } from './data/examples';
import { CodeEditor, type HighlightRange } from './components/CodeEditor';
import { ReviewPanel, type ReviewStatus } from './components/ReviewPanel';
import { MAX_CODE_CHARS, validateCodeInput } from './shared/reviewLogic';
import type {
  ReviewErrorResponse,
  ReviewIssue,
  ReviewResponse,
  SelectedLanguage,
} from './shared/types';

export default function App() {
  const [language, setLanguage] = useState<SelectedLanguage>('html_css');
  const [code, setCode] = useState<string>('');
  const [status, setStatus] = useState<ReviewStatus>('empty');
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [highlightedRange, setHighlightedRange] = useState<HighlightRange | null>(null);

  const highlightNonceRef = useRef(0);
  const resultsColumnRef = useRef<HTMLElement | null>(null);

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

      setReview(parsedBody as ReviewResponse);
      setStatus('success');
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

  return (
    <div className="min-h-screen bg-[#0D0E11] text-[#ECEEF2] flex flex-col">
      <header className="border-b border-[#22262F] bg-[#0D0E11]">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-[#ECEEF2] whitespace-nowrap">
            NovisCode
          </h1>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-5 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left column: Code editor */}
          <section aria-label="Editor de cod și controale" className="space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Language segmented control */}
              <div
                role="group"
                aria-label="Selectează limbajul"
                className="inline-flex items-center rounded-lg border border-[#262A33] bg-[#14161B] p-1"
              >
                <button
                  type="button"
                  onClick={() => setLanguage('html_css')}
                  aria-pressed={language === 'html_css'}
                  className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] cursor-pointer whitespace-nowrap ${
                    language === 'html_css'
                      ? 'bg-[#232732] text-[#FFFFFF]'
                      : 'text-[#94A3B8] hover:text-[#ECEEF2]'
                  }`}
                >
                  HTML/CSS
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('cpp')}
                  aria-pressed={language === 'cpp'}
                  className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] cursor-pointer whitespace-nowrap ${
                    language === 'cpp'
                      ? 'bg-[#232732] text-[#FFFFFF]'
                      : 'text-[#94A3B8] hover:text-[#ECEEF2]'
                  }`}
                >
                  C++
                </button>
              </div>

              {/* Example loader buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadExample('html_css')}
                  disabled={status === 'loading'}
                  className="rounded-md border border-[#262A33] bg-[#14161B] px-3 py-1.5 text-xs font-medium text-[#CBD5E1] hover:border-[#363C49] hover:text-[#FFFFFF] disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] cursor-pointer whitespace-nowrap"
                >
                  Exemplu HTML/CSS
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadExample('cpp')}
                  disabled={status === 'loading'}
                  className="rounded-md border border-[#262A33] bg-[#14161B] px-3 py-1.5 text-xs font-medium text-[#CBD5E1] hover:border-[#363C49] hover:text-[#FFFFFF] disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] cursor-pointer whitespace-nowrap"
                >
                  Exemplu C++
                </button>
              </div>
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
              onRetry={submitReview}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
