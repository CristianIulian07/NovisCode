import { GoogleGenAI } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../../systemInstruction';
import {
  MalformedReviewError,
  countLines,
  parseReviewResponse,
  prependLineNumbers,
} from '../shared/reviewLogic';
import type { ReviewResponse, SelectedLanguage } from '../shared/types';
import { REVIEW_RESPONSE_SCHEMA } from './reviewSchema';

export class ReviewerServiceError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ReviewerServiceError';
    this.status = status;
    this.code = code;
  }
}

const MODEL_NAME = 'gemini-4-hydrogen';

function createClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new ReviewerServiceError(
      'Cheia API pentru analiza codului nu este configurată pe server.',
      500,
      'MISSING_API_KEY',
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function classifyGeminiError(error: unknown): ReviewerServiceError {
  if (error instanceof ReviewerServiceError) {
    return error;
  }
  if (error instanceof MalformedReviewError) {
    return new ReviewerServiceError(
      'Răspunsul primit de la model nu a putut fi interpretat corect. Încearcă din nou.',
      502,
      'MALFORMED_JSON',
    );
  }

  const rawMessage = error instanceof Error ? error.message : String(error ?? '');
  const lower = rawMessage.toLowerCase();
  const statusProp =
    typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status?: unknown }).status)
      : NaN;

  if (statusProp === 429 || lower.includes('resource_exhausted') || lower.includes('quota') || lower.includes('429')) {
    return new ReviewerServiceError(
      'Serviciul de analiză a atins temporar limita de cereri. Așteaptă câteva momente și încearcă din nou.',
      429,
      'QUOTA_EXCEEDED',
    );
  }

  if (
    statusProp === 401 ||
    statusProp === 403 ||
    lower.includes('api_key_invalid') ||
    lower.includes('permission_denied') ||
    lower.includes('api key')
  ) {
    return new ReviewerServiceError(
      'Serviciul de analiză a respins autentificarea API. Verifică configurarea cheii pe server.',
      502,
      'API_AUTH_ERROR',
    );
  }

  if (lower.includes('safety') || lower.includes('blocked')) {
    return new ReviewerServiceError(
      'Analiza acestui fragment a fost oprită de filtrele de siguranță. Ajustează textul și încearcă din nou.',
      422,
      'SAFETY_BLOCKED',
    );
  }

  if (
    lower.includes('fetch') ||
    lower.includes('network') ||
    lower.includes('econnreset') ||
    lower.includes('etimedout') ||
    lower.includes('timeout') ||
    lower.includes('enotfound')
  ) {
    return new ReviewerServiceError(
      'Nu am putut comunica cu serviciul de analiză din cauza unei erori de rețea. Încearcă din nou.',
      504,
      'NETWORK_ERROR',
    );
  }

  return new ReviewerServiceError(
    'A apărut o problemă neașteptată în timpul analizei codului. Încearcă din nou.',
    502,
    'UPSTREAM_ERROR',
  );
}

export async function reviewStudentCode(
  code: string,
  selectedLanguage: SelectedLanguage,
): Promise<ReviewResponse> {
  const ai = createClient();
  const totalLines = countLines(code);
  const numberedCode = prependLineNumbers(code);
  const languageLabel = selectedLanguage === 'html_css' ? 'HTML/CSS' : 'C++ (C++17)';

  const prompt = [
    `Limbajul selectat de student în interfață: ${languageLabel}`,
    'Codul trimis spre analiză (numerotat pe linii):',
    '```',
    numberedCode,
    '```',
  ].join('\n');

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 0.2,
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: REVIEW_RESPONSE_SCHEMA,
      },
    });

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason === 'SAFETY' || finishReason === 'PROHIBITED_CONTENT' || finishReason === 'RECITATION') {
      throw new ReviewerServiceError(
        'Analiza acestui fragment a fost oprită de filtrele de siguranță. Verifică conținutul și încearcă din nou.',
        422,
        'SAFETY_BLOCKED',
      );
    }

    const text = response.text ?? '';
    return parseReviewResponse(text, totalLines);
  } catch (error) {
    throw classifyGeminiError(error);
  }
}
