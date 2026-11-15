import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCodeInput } from './src/shared/reviewLogic';
import type { SelectedLanguage } from './src/shared/types';
import { ReviewerServiceError, reviewStudentCode } from './src/server/geminiReviewer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.post('/api/review', async (req: Request, res: Response) => {
    const body = req.body as { code?: unknown; language?: unknown } | undefined;
    const code = typeof body?.code === 'string' ? body.code : '';
    const language: SelectedLanguage =
      body?.language === 'cpp' || body?.language === 'html_css'
        ? body.language
        : 'html_css';

    const validation = validateCodeInput(code);
    if (!validation.valid) {
      res.status(400).json({
        error: validation.error ?? 'Date de intrare invalide.',
        code: 'INVALID_INPUT',
      });
      return;
    }

    try {
      const review = await reviewStudentCode(code, language);
      res.status(200).json(review);
    } catch (error) {
      if (error instanceof ReviewerServiceError) {
        res.status(error.status).json({
          error: error.message,
          code: error.code,
        });
        return;
      }
      res.status(500).json({
        error: 'A apărut o eroare internă pe server. Încearcă din nou.',
        code: 'INTERNAL_ERROR',
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NovisCode server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
