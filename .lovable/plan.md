
# Correction du PDF imprimable -- Texte invisible sur fond vert

## Diagnostic

Le PDF imprime un fond vert degrade correctement, mais presque tout le texte est invisible car :

1. **Inline styles non surcharges** : Les titres h1, h2 utilisent `style={{ color: '#1a1a18' }}` (quasi-noir). Les CSS print ne peuvent pas surcharger des styles inline sans cibler directement les elements avec `!important` sur des selecteurs plus specifiques ou universels.
2. **Selecteurs CSS trop etroits** : Le print CSS cible `.print-plaquette .text-stone-600` mais beaucoup de textes utilisent des inline styles ou des classes non couvertes.
3. **Cards avec fond blanc semi-transparent** : Les `rgba(255,255,255,0.65)` sur les cards sont trop transparents sur fond sombre, rendant le texte illisible.

## Solution

### Fichier `src/index.css` -- Selecteurs print agressifs

Remplacer les selecteurs print actuels (lignes 555-746) par une approche "noyau dur" :

- **Forcer TOUS les textes en clair** : `.print-plaquette h1, .print-plaquette h2, .print-plaquette h3, .print-plaquette h4, .print-plaquette p, .print-plaquette span, .print-plaquette em, .print-plaquette strong, .print-plaquette li, .print-plaquette label` avec `color: #f0f7f4 !important` en regle universelle
- **Cibler specifiquement les inline styles** : Ajouter des attributs-selecteurs comme `.print-plaquette [style*="color"]` pour forcer la couleur claire meme sur les elements avec style inline
- **Titres h1/h2** : `color: #ffffff !important` (blanc pur)
- **Accents (strong, em, labels)** : `color: #86efac !important` (menthe)
- **Cards** : Augmenter l'opacite du fond a `rgba(255,255,255,0.12)` pour creer un contraste subtil mais suffisant

### Fichier `src/pages/MarchesDuVivantExplorer.tsx` -- Retirer les inline styles pour le print

Approche complementaire et plus fiable :

- **Titres (h1, h2)** : Ajouter des classes `print:!text-white` sur les elements qui utilisent `style={{ color: '#1a1a18' }}`
- **Paragraphes** : Ajouter `print:!text-gray-200` sur les elements `text-stone-600`, `text-stone-500`
- **Gradient text** (`bg-clip-text text-transparent`) : Ajouter `print:!bg-none print:!text-emerald-300` pour que le texte soit lisible en print
- **Cards de timeline** : Ajouter `print:!bg-white/10 print:!border-emerald-400/30` pour un contraste subtil sur fond sombre
- **Roles / piliers** : Ajouter `print:!text-gray-100` sur les descriptions

## Recapitulatif des corrections par section PDF

| Section | Probleme | Correction |
|---------|----------|------------|
| Couverture (p.1) | Texte visible sauf baseline | Classe `print:!text-gray-200` sur paragraphes |
| Piliers (p.1-2) | Tout invisible | Classes `print:!text-white` sur titres, `print:!text-gray-200` sur texte, `print:!bg-none print:!text-emerald-300` sur gradient text |
| Comment ca marche (p.2) | Tout invisible | Idem + cards avec `print:!bg-white/10` |
| Progression (p.2) | Tout invisible | Roles + descriptions en clair |
| Zones blanches (p.2-3) | Tout invisible | Texte explicatif + barres en clair |
| Timeline experience (p.3) | Tout invisible sauf ligne | Titres h3 + paragraphes en clair, time boxes adaptees |
| Calendrier (p.4) | Partiellement visible | Deja presque bon, ajuster les labels |
| CTA (p.4) | Visible | Pas de changement necessaire |

## Strategie technique

La double approche (CSS universels + classes Tailwind `print:`) garantit que :
- Les inline styles sont surcharges par les selecteurs CSS agressifs
- Les classes Tailwind `print:!` servent de "filet de securite" element par element
- Le rendu est coherent sur Chrome, Firefox et Safari
