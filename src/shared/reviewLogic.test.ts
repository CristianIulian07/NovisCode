import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_CODE_CHARS,
  MalformedReviewError,
  applySnippetToCode,
  countLines,
  formatReviewAsMarkdown,
  getLanguageMismatchNotice,
  isSelectedLanguage,
  parseReviewResponse,
  prependLineNumbers,
  sortIssuesBySeverity,
  validateCodeInput,
} from './reviewLogic';
import type { ReviewIssue } from './types';

test('validateCodeInput rejects empty and whitespace-only strings', () => {
  const empty = validateCodeInput('');
  assert.equal(empty.valid, false);
  assert.ok(empty.error);

  const spaces = validateCodeInput('   \n\t  ');
  assert.equal(spaces.valid, false);
  assert.equal(spaces.charCount, 7);
});

test('validateCodeInput enforces MAX_CODE_CHARS limit', () => {
  const exact = 'a'.repeat(MAX_CODE_CHARS);
  assert.equal(validateCodeInput(exact).valid, true);

  const over = 'a'.repeat(MAX_CODE_CHARS + 1);
  const res = validateCodeInput(over);
  assert.equal(res.valid, false);
  assert.match(res.error ?? '', /8\.000/);
});

test('isSelectedLanguage validates all 5 supported languages', () => {
  for (const lang of ['c', 'cpp', 'python', 'javascript', 'html_css']) {
    assert.equal(isSelectedLanguage(lang), true);
  }
  assert.equal(isSelectedLanguage('rust'), false);
  assert.equal(isSelectedLanguage(null), false);
});

test('prependLineNumbers prefixes every line with 1-indexed numbers', () => {
  const sample = 'int main(void) {\n  return 0;\n}';
  assert.equal(prependLineNumbers(sample), '1| int main(void) {\n2|   return 0;\n3| }');
  assert.equal(countLines(sample), 3);
});

test('sortIssuesBySeverity orders critical -> important -> minor, then line_start', () => {
  const issues: ReviewIssue[] = [
    {
      id: 'm1',
      category: 'readability',
      severity: 'minor',
      line_start: 2,
      line_end: 2,
      title: 'Minor',
      why_it_matters: 'w',
      how_to_fix: 'h',
      fixed_snippet: 'x',
      concept_to_learn: 'c',
    },
    {
      id: 'c2',
      category: 'bug',
      severity: 'critical',
      line_start: 10,
      line_end: 10,
      title: 'Crit 2',
      why_it_matters: 'w',
      how_to_fix: 'h',
      fixed_snippet: 'x',
      concept_to_learn: 'c',
    },
    {
      id: 'i1',
      category: 'best_practice',
      severity: 'important',
      line_start: 4,
      line_end: 5,
      title: 'Imp',
      why_it_matters: 'w',
      how_to_fix: 'h',
      fixed_snippet: 'x',
      concept_to_learn: 'c',
    },
    {
      id: 'c1',
      category: 'bug',
      severity: 'critical',
      line_start: 3,
      line_end: 3,
      title: 'Crit 1',
      why_it_matters: 'w',
      how_to_fix: 'h',
      fixed_snippet: 'x',
      concept_to_learn: 'c',
    },
  ];

  const sorted = sortIssuesBySeverity(issues);
  assert.deepEqual(
    sorted.map((i) => i.id),
    ['c1', 'c2', 'i1', 'm1'],
  );
});

test('parseReviewResponse handles valid JSON across languages, clamps lines, and filters invalid priority IDs', () => {
  const raw = JSON.stringify({
    detected_language: 'c',
    verdict: { level: 'decent', one_line: 'Structura de bază este clară, dar există o depășire de limită.' },
    strengths: ['Ai eliberat memoria alocată cu free().'],
    issues: [
      {
        id: 'iss-minor',
        category: 'readability',
        severity: 'minor',
        line_start: 2,
        line_end: 2,
        title: 'Nume de variabilă neclar',
        why_it_matters: 'Scade lizibilitatea.',
        how_to_fix: 'Redenumește variabila.',
        fixed_snippet: 'int numar_note = 0;',
        concept_to_learn: 'variable naming',
      },
      {
        id: 'iss-crit',
        category: 'bug',
        severity: 'critical',
        line_start: 99,
        line_end: 50,
        title: 'Acces în afara limitelor',
        why_it_matters: 'Poate corupe memoria.',
        how_to_fix: 'Folosește < în loc de <=.',
        fixed_snippet: 'for (int i = 0; i < n; ++i)',
        concept_to_learn: 'off-by-one error',
      },
    ],
    top_priorities: ['iss-crit', 'non-existent', 'iss-minor', 'iss-crit'],
    mentor_note: 'Concentrează-te mai întâi pe condiția buclei.',
  });

  const parsed = parseReviewResponse(raw, 12);
  assert.equal(parsed.detected_language, 'c');
  assert.equal(parsed.issues[0].id, 'iss-crit');
  assert.equal(parsed.issues[0].line_start, 12);
  assert.equal(parsed.issues[0].line_end, 12);
  assert.deepEqual(parsed.top_priorities, ['iss-crit', 'iss-minor']);

  const markdown = formatReviewAsMarkdown(parsed, 'c');
  assert.match(markdown, /Raport Code Review — NovisCode \(C\)/);
  assert.match(markdown, /Acces în afara limitelor/);
});

test('applySnippetToCode replaces targeted 1-indexed line range cleanly', () => {
  const original = ['int suma;', 'for (int i = 0; i <= n; i++) {', '  suma += v[i];', '}'].join('\n');
  const updated = applySnippetToCode(original, 1, 2, 'int suma = 0;\nfor (int i = 0; i < n; i++) {');
  assert.equal(
    updated,
    ['int suma = 0;', 'for (int i = 0; i < n; i++) {', '  suma += v[i];', '}'].join('\n'),
  );
});

test('parseReviewResponse strips markdown code fences and rejects malformed payloads', () => {
  const fenced = '```json\n{"detected_language":"empty","verdict":{"level":"needs_work","one_line":"Cod gol."},"strengths":[],"issues":[],"top_priorities":[],"mentor_note":"Introdu cod."}\n```';
  const result = parseReviewResponse(fenced, 1);
  assert.equal(result.detected_language, 'empty');

  assert.throws(() => parseReviewResponse('{bad json', 5), MalformedReviewError);
  assert.throws(() => parseReviewResponse('', 5), MalformedReviewError);
});

test('getLanguageMismatchNotice reports mismatch only for real cross-language selection', () => {
  assert.equal(getLanguageMismatchNotice('python', 'python'), null);
  assert.equal(getLanguageMismatchNotice('c', 'unsupported'), null);
  assert.equal(getLanguageMismatchNotice('c', 'empty'), null);

  const notice = getLanguageMismatchNotice('html_css', 'python');
  assert.ok(notice);
  assert.match(notice, /HTML\/CSS/);
  assert.match(notice, /Python/);
});
