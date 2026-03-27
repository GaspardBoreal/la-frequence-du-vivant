

# Fix du debordement des boutons et mise en coherence de la page Admin

## Probleme

Dans la carte "Evenements & Communaute", les deux boutons cote a cote debordent du widget car le texte + icone ne tient pas dans l'espace `flex-1`. Le meme risque existe sur la carte CRM avec ses boutons Pipeline/Equipe.

## Corrections

### 1. Carte "Evenements & Communaute" (lignes 126-139)

Passer les deux boutons en **layout vertical** (`flex-col`) comme la carte CRM, avec des boutons `w-full` empiles. Cela elimine le debordement et aligne le style avec les autres cartes multi-boutons.

### 2. Carte CRM (lignes 152-173)

Deja en `flex-col` pour le bouton principal, mais les sous-boutons Pipeline/Equipe sont en `flex gap-2` horizontal. Garder tel quel car les labels sont courts, mais ajouter `text-sm` pour securiser.

### 3. Coherence globale des cartes

- Uniformiser la hauteur des descriptions avec `min-h-[4rem]` sur tous les `<p>` pour que les boutons s'alignent verticalement dans la grille.
- Retirer le `border-2 border-emerald-500/20 bg-emerald-500/5` de la carte Evenements pour qu'elle ait le meme style que les autres (ou le garder mais avec la meme base que CRM — je propose de le conserver pour distinguer les sections cles).

### Fichier modifie

| Fichier | Changement |
|---------|-----------|
| `src/pages/AdminAccess.tsx` | Boutons Evenements en vertical, `min-h` sur descriptions, `text-sm` sur boutons compacts |

