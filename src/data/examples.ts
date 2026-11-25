import type { SelectedLanguage } from '../shared/types';

export interface CodeExample {
  id: SelectedLanguage;
  buttonLabel: string;
  code: string;
}

export const C_EXAMPLE: CodeExample = {
  id: 'c',
  buttonLabel: 'Exemplu C (PCLP)',
  code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

double calculeaza_media(int *v, int n) {
    int suma;
    for (int i = 0; i <= n; i++) {
        suma += v[i];
    }
    return suma / n;
}

int main(void) {
    int n;
    char nume_student[16];

    printf("Nume student: ");
    scanf("%s", nume_student);

    printf("Numar de laboratoare: ");
    scanf("%d", n);

    int *punctaje = malloc(n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &punctaje[i]);
    }

    printf("Media pentru %s este %.2f\\n", nume_student, calculeaza_media(punctaje, n));
    return 0;
}`,
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

export const PYTHON_EXAMPLE: CodeExample = {
  id: 'python',
  buttonLabel: 'Exemplu Python',
  code: `def adauga_nota(nota, catalog=[]):
    catalog.append(nota)
    return catalog

def citeste_punctaje(cale_fisier):
    f = open(cale_fisier, "r")
    linii = f.readlines()
    list = []
    for linie in linii:
        try:
            val = int(linie)
            if val != None and val >= 5:
                list.append(val)
        except:
            pass
    return sum(list) / len(list)

note_sem1 = adauga_nota(9)
note_sem2 = adauga_nota(7)
print("Note semestrul 2:", note_sem2)`,
};

export const JAVASCRIPT_EXAMPLE: CodeExample = {
  id: 'javascript',
  buttonLabel: 'Exemplu JS',
  code: `async function afiseazaProfilStudent(idStudent) {
  const raspuns = fetch("/api/studenti?id=" + idStudent);
  const date = raspuns.json();

  if (date.activ == "true") {
    const card = document.getElementById("profil");
    card.innerHTML = "<h2>Salut, " + date.nume + "</h2>";
  }

  for (var i = 0; i < date.materii.length; i++) {
    setTimeout(function () {
      console.log("Materia #" + i + ": " + date.materii[i]);
    }, 100);
  }
}`,
};

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

export const CODE_EXAMPLES: Record<SelectedLanguage, CodeExample> = {
  c: C_EXAMPLE,
  cpp: CPP_EXAMPLE,
  python: PYTHON_EXAMPLE,
  javascript: JAVASCRIPT_EXAMPLE,
  html_css: HTML_CSS_EXAMPLE,
};
