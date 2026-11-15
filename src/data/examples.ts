import type { SelectedLanguage } from '../shared/types';

export interface CodeExample {
  id: SelectedLanguage;
  buttonLabel: string;
  code: string;
}

export const HTML_CSS_EXAMPLE: CodeExample = {
  id: 'html_css',
  buttonLabel: 'Exemplu HTML/CSS',
  code: `<html>
<head>
  <title>Portofoliu Andrei</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      color: #b0b0b0;
    }
    .container {
      width: 960px;
      margin: 0 auto;
    }
    .btn {
      background: #2563eb !important;
      color: white !important;
      padding: 10px 18px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Salut, sunt Andrei</h1>
      <h3>Student la informatică</h3>
    </div>

    <div class="about">
      <img src="avatar.jpg" width="180">
      <p style="font-size: 18px; color: #333;">Învăț să construiesc site-uri web și îmi place algoritmica.</p>
      <a href="https://github.com/andrei-dev" target="_blank">Vezi profilul meu GitHub</a>
    </div>

    <form action="/contact" method="post">
      <input type="text" id="contact-field" placeholder="Numele tău">
      <input type="email" id="contact-field" placeholder="Email">
      <button type="submit" class="btn">Trimite mesajul</button>
    </form>
  </div>
</body>
</html>`,
};

export const CPP_EXAMPLE: CodeExample = {
  id: 'cpp',
  buttonLabel: 'Exemplu C++',
  code: `#include <iostream>
#include <cstring>

using namespace std;

double calculeazaMedia(int note[], int n) {
    int suma;
    for (int i = 0; i <= n; i++) {
        suma += note[i];
        cout << "Nota " << i + 1 << ": " << note[i] << endl;
    }
    return suma / n;
}

int main() {
    int n;
    cout << "Cate note introduci? ";
    cin >> n;

    int* note = new int[n];
    for (int i = 0; i < n; i++) {
        cin >> note[i];
    }

    char mesaj[12];
    strcpy(mesaj, "Media finala este:");

    double media = calculeazaMedia(note, n);
    cout << mesaj << " " << media << endl;
}`,
};

export const CODE_EXAMPLES: Record<SelectedLanguage, CodeExample> = {
  html_css: HTML_CSS_EXAMPLE,
  cpp: CPP_EXAMPLE,
};
