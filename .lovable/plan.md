## Objectif
Sur `/marches-du-vivant/explorer`, remplacer le bouton « Imprimer / PDF » (icône `Printer` ligne 232‑234) par un lien LinkedIn vers la page entreprise, avec une intégration visuelle cohérente avec la charte émeraude/stone de la page.

## Changements (fichier unique : `src/pages/MarchesDuVivantExplorer.tsx`)

1. **Imports** — remplacer `Printer` par `Linkedin` dans l'import `lucide-react` (ligne 8‑9).
2. **Supprimer `handlePrint`** (ligne 88) — devenu inutile.
3. **Remplacer le `<button>` ligne 232‑234** par un `<a>` :
   - `href="https://www.linkedin.com/company/la-fr%C3%A9quence-du-vivant/"`
   - `target="_blank"`, `rel="noopener noreferrer"`
   - `aria-label="Suivre La Fréquence du Vivant sur LinkedIn"`
   - `title="Suivre sur LinkedIn"`
   - Conserve `print:hidden` côté nav (le parent l'a déjà).

## Direction visuelle (intégration design)
Plutôt qu'un bleu LinkedIn brut (qui jurerait avec la palette Papier Crème / émeraude), adopter un **bouton émeraude tonal** assorti à la page, avec un *hover* qui révèle le bleu LinkedIn — clin d'œil élégant :

```text
État repos : pastille ronde fond emerald-50/70, ring emerald-200/60,
              icône Linkedin w-4 h-4 text-emerald-700
État hover : fond emerald-100, icône passe en text-[#0A66C2] (bleu LinkedIn officiel),
              légère élévation (shadow-sm) + scale-105, transition 300ms
Focus      : ring-2 ring-emerald-400/50 ring-offset-2 ring-offset-stone-50
```

Classes proposées :
```
group inline-flex items-center justify-center w-9 h-9 rounded-full
bg-emerald-50/70 ring-1 ring-emerald-200/60
text-emerald-700 hover:text-[#0A66C2]
hover:bg-emerald-100 hover:shadow-sm hover:-translate-y-0.5 hover:scale-105
transition-all duration-300 ease-out
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60
```

## Hors scope
- Pas de modification de SEO/meta, pas de tracking analytics, pas d'autres icônes de la barre.
- Pas de toucher aux styles `@media print`.
