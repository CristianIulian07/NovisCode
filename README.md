# NovisCode — AI Code Mentor for Beginners

**NovisCode** este o aplicație web full-stack de code review asistat de AI, gândită special pentru studenți și programatori aflați la început de drum. Lipești codul tău în **C**, **C++**, **Python**, **JavaScript** sau **HTML/CSS**, iar aplicația îți oferă un review structurat, ancorat pe linii exacte din editor: ce ai făcut bine, ce trebuie reparat, *de ce* contează în practică și cum poți aplica reparația direct în cod.

## De ce există

Compilatoarele și linterele semnalează erorile de sintaxă, dar rareori explică pe înțelesul unui student de anul I *de ce* o practică duce la buguri de memorie, vulnerabilități sau comportament nedefinit și *ce concept* merită aprofundat. NovisCode acționează ca un asistent de laborator răbdător și riguros.

## Funcționalități cheie

- **5 limbaje suportate cu evidențiere sintactică (CodeMirror 6):** `C (C11)`, `C++ (C++17)`, `Python 3`, `JavaScript (ES2022+)` și `HTML/CSS`
- **Backend propriu Express.js:** Cheia `GEMINI_API_KEY` rămâne strict pe server (`/api/review` & `/api/health`), fără a fi expusă în browser
- **Structured JSON Output & Validare:** Răspunsurile modelului Gemini sunt constrânse printr-un `responseSchema` strict, normalizate, sortate după severitate (`critical` → `important` → `minor`) și ancorate la intervale reale de linii (`line_start`–`line_end`)
- **Interactivitate directă cu editorul:**
  - Click pe orice observație sau prioritate derulează și evidențiază liniile vizate în editor
  - Buton **„Aplică în editor”** pentru înlocuirea directă a secvenței problematice (cu suport `Ctrl+Z` / Undo în CodeMirror) și buton de copiere rapidă
- **Istoric local & Export Markdown:** Ultimele 10 analize sunt salvate în `localStorage` pentru compararea progresului, iar fiecare review poate fi descărcat ca fișier `.md`
- **Exemple didactice preîncărcate:** Fragmente de cod cu greșeli autentice de anul I (ex. alocări `malloc` și `scanf` în C, `new[]`/`strcpy` în C++, argumente mutabile implicite în Python, `async/await` + DOM XSS în JS, accesibilitate în HTML/CSS)

## Arhitectură & Tehnologii

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, CodeMirror 6, Lucide Icons
- **Backend:** Node.js, Express 4, `@google/genai` SDK (Google Gemini API)
- **Testare & Calitate:** Node.js Test Runner (`node:test`), TypeScript strict type-checking

```text
NovisCode/
├── server.ts                      # Server Express (/api/health, /api/review + Vite middleware / static build)
├── systemInstruction.ts           # Promptul de sistem cu reguli anti-prompt-injection și criterii pe limbaje
├── src/
│   ├── App.tsx                    # Interfața principală, istoric local și stări de analiză
│   ├── components/
│   │   ├── CodeEditor.tsx         # Editor CodeMirror 6 cu suport multi-limbaj și evidențiere pe linii
│   │   ├── IssueCard.tsx          # Card de observație cu severitate, explicații și aplicare snippet
│   │   ├── ReviewPanel.tsx        # Sumar verdict, puncte forte, priorități și export Markdown
│   │   └── ReviewSkeleton.tsx     # Stare de încărcare accesibilă
│   ├── data/
│   │   └── examples.ts            # Exemple cu buguri reale pentru C, C++, Python, JS și HTML/CSS
│   ├── server/
│   │   ├── geminiReviewer.ts      # Integrare Gemini API și clasificare erori HTTP/rețea/cotă
│   │   └── reviewSchema.ts        # Schema JSON impusă modelului Gemini
│   └── shared/
│       ├── types.ts               # Tipuri partajate client-server
│       ├── reviewLogic.ts         # Validare, numerotare linii, parsare JSON, aplicare snippet & export .md
│       └── reviewLogic.test.ts    # Suite de teste unitare
└── package.json
```

## Rulare locală

### Cerințe
- **Node.js 20+**
- O cheie gratuită **Google Gemini API** din [Google AI Studio](https://aistudio.google.com/apikey)

### Pași de instalare

```bash
git clone https://github.com/CristianIulian07/NovisCode.git
cd NovisCode
npm install
```

Creează fișierul `.env` în rădăcina proiectului pornind de la `.env.example`:

```bash
cp .env.example .env
```

Completează cheia ta în `.env`:

```env
GEMINI_API_KEY=cheia_ta_gemini_aici
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
```

Pornește serverul de dezvoltare (frontend + backend pe același port):

```bash
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000) în browser.

## Verificare & Build pentru producție

```bash
npm test          # Rulează testele unitare
npm run lint      # Verifică tipurile TypeScript (tsc --noEmit)
npm run build     # Construiește bundle-ul de producție în dist/
npm start         # Pornește serverul Express în modul production
```

## Licență

Distribuit sub licența [MIT](./LICENSE).
