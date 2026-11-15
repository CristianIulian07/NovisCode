# CodeMentor

Code reviewer pentru programatori începători. Lipești codul tău HTML/CSS sau C++, apeși un buton și primești un review structurat, ca de la un mentor real: ce ai făcut bine, ce trebuie reparat, de ce contează și cum se repară.

> **Status:** schelet inițial. Proiectul este în lucru și va fi îmbunătățit.

## De ce există

Linterele și compilatoarele spun *ce* e greșit, dar rareori *de ce* contează și *ce să înveți* mai departe. CodeMentor încearcă să umple golul ăsta pentru începători: feedback concret, legat de linii exacte din cod, fără sfaturi generice.

## Funcționalități

- Suport pentru **HTML/CSS** și **C++** (C++17)
- Review structurat, cu probleme sortate după severitate: `critical`, `important`, `minor`
- Fiecare problemă include categoria, intervalul de linii, explicația („de ce contează"), soluția, un snippet corectat și un concept de căutat mai departe
- Secțiune „Ce ai făcut bine" și top 3 priorități
- Click pe o problemă evidențiază liniile corespunzătoare în editor
- Exemple de cod cu greșeli reale, ca să poți testa rapid
- Stări de interfață pentru: gol, încărcare, eroare, rezultat
- Interfață în limba română

## Cum funcționează

1. Utilizatorul lipește codul și alege limbajul.
2. Aplicația numerotează liniile (`1| cod`) și trimite codul către Gemini, împreună cu un **System Instruction** strict.
3. Gemini răspunde doar în **JSON**, validat cu un `responseSchema`, ca să nu poată returna text vag și neancorat în cod.
4. Aplicația parsează răspunsul și afișează review-ul.

Câteva alegeri care reduc răspunsurile generice:

- **Structured output:** fiecare problemă trebuie să indice linii concrete și să respecte limite de lungime.
- **Temperatură mică** (0.2), pentru răspunsuri consecvente.
- **Codul trimis e tratat ca date, nu ca instrucțiuni**, deci comentariile de tip „ignoră regulile" sunt ignorate.
- Reguli explicite pentru ce **nu** se raportează: probleme inventate, preferințe de stil, laudă fabricată.

## Tehnologii

- React + TypeScript
- Tailwind CSS
- Google Gemini API (`@google/genai`)

## Rulare locală

Cerințe: Node.js 18+ și o cheie API de la [Google AI Studio](https://aistudio.google.com/).

```bash
git clone <URL-ul-repo-ului>
cd <numele-folderului>
npm install
```

Creează un fișier `.env.local` în rădăcina proiectului:

```
GEMINI_API_KEY=cheia_ta_aici
```

Apoi pornește aplicația:

```bash
npm run dev
```

> Numele variabilei și comenzile pot diferi puțin în funcție de cum a generat AI Studio proiectul. Verifică `package.json` și fișierele de configurare.

## Structura proiectului

> Completează după ce te uiți în proiect.

```
src/
  components/        # editor, carduri de probleme, stări UI
  systemInstruction.ts   # promptul de sistem trimis către Gemini
  ...
```

## Securitate

- **Nu comite niciodată cheia API.** Adaugă `.env*` în `.gitignore`.
- Dacă aplicația apelează Gemini direct din browser, cheia e vizibilă pentru oricine deschide aplicația. E acceptabil pentru un demo local, dar pentru o versiune publică apelul trebuie mutat pe un server.

## Limitări cunoscute

- Review-ul vine de la un model AI și poate greși sau rata probleme. Verifică-l cu documentația și cu propriul compilator.
- Limita de 8.000 de caractere pe cod trimis.
- Doar HTML/CSS și C++ (fără JavaScript sau alte limbaje).

## Idei pentru viitor

- [ ] Suport pentru Python și JavaScript
- [ ] Istoric al review-urilor
- [ ] Comutator limbă RO/EN
- [ ] Apel către Gemini printr-un backend propriu

## Licență

Alege una (de exemplu MIT) și adaug-o într-un fișier `LICENSE`.
