import { Type, type Schema } from '@google/genai';

export const REVIEW_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    detected_language: {
      type: Type.STRING,
      enum: ['html_css', 'cpp', 'unsupported', 'empty'],
    },
    verdict: {
      type: Type.OBJECT,
      properties: {
        level: {
          type: Type.STRING,
          enum: ['needs_work', 'decent', 'solid'],
        },
        one_line: {
          type: Type.STRING,
        },
      },
      required: ['level', 'one_line'],
    },
    strengths: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
    },
    issues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          category: {
            type: Type.STRING,
            enum: [
              'bug',
              'security',
              'performance',
              'readability',
              'best_practice',
              'accessibility',
            ],
          },
          severity: {
            type: Type.STRING,
            enum: ['critical', 'important', 'minor'],
          },
          line_start: { type: Type.INTEGER },
          line_end: { type: Type.INTEGER },
          title: { type: Type.STRING },
          why_it_matters: { type: Type.STRING },
          how_to_fix: { type: Type.STRING },
          fixed_snippet: { type: Type.STRING },
          concept_to_learn: { type: Type.STRING },
        },
        required: [
          'id',
          'category',
          'severity',
          'line_start',
          'line_end',
          'title',
          'why_it_matters',
          'how_to_fix',
          'fixed_snippet',
          'concept_to_learn',
        ],
      },
    },
    top_priorities: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
    },
    mentor_note: {
      type: Type.STRING,
    },
  },
  required: [
    'detected_language',
    'verdict',
    'strengths',
    'issues',
    'top_priorities',
    'mentor_note',
  ],
};
