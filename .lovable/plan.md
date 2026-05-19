## Problème

Dans la Chaîne trophique → Constellation, cliquer sur un niveau (ex. « Producteurs primaires ») dans le panneau de droite remplace le contenu par `LevelPanel`, mais ce panneau **n'a aucun moyen de retour**. Le seul bouton « Réinitialiser » est en haut à droite du SVG de gauche — éloigné du regard, peu lisible, et invisible sur mobile (le panneau passe sous la constellation). Idem pour `SelectedStarPanel` (clic sur une étoile).

## Solution UX — un en-tête de panneau cohérent

Ajouter un **en-tête sticky** en haut des panneaux contextuels (`LevelPanel` et `SelectedStarPanel`) avec :

- À gauche : bouton ghost discret `← Vue d'ensemble` (ChevronLeft + label court)
- À droite : icône `X` (close) en cercle sur fond `bg-muted/40`, taille 24px, hover `bg-muted`

Les deux actions appellent le même `onClose` qui remet `selected=null` et `focusGroup=null`. Le panneau revient à `DefaultPanel`.

### Pourquoi c'est efficace

- **Loi de proximité** : l'action « fermer » est au même endroit que ce qu'on ferme. Plus besoin de chercher « Réinitialiser » à l'autre bout de l'écran.
- **Deux affordances** : la flèche textuelle (explicite, accessible) + le X (rapide, universel) couvrent débutants et power users.
- **Cohérence mobile** : sur petit écran le panneau est sous le SVG → le bouton flottant « Réinitialiser » était hors écran. L'en-tête sticky reste toujours visible.
- **Sobriété informationnelle** : pas de nouveau composant, pas d'overlay, juste un header `flex justify-between` de 32px de haut.

### Bonus visuel

- Dans `DefaultPanel`, mettre en évidence le dernier niveau visité (anneau coloré autour de la pastille) — non bloquant, peut être livré plus tard.
- Le bouton flottant « Réinitialiser » sur le SVG reste (utile quand on a juste un `focusGroup` via clic sur un anneau, sans avoir ouvert le panneau).

## Changements techniques

Fichier : `src/components/community/synthese/trophic/_panels.tsx`

1. `LevelPanel` : ajouter prop `onClose: () => void`. Insérer en première position :
```tsx
<div className="flex items-center justify-between -mt-1 -mx-1 pb-2 border-b border-border/50">
  <button onClick={onClose} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition px-1.5 py-1 rounded-md hover:bg-muted/60">
    <ChevronLeft className="w-3.5 h-3.5" /> Vue d'ensemble
  </button>
  <button onClick={onClose} aria-label="Fermer" className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition">
    <X className="w-3 h-3" />
  </button>
</div>
```
2. `SelectedStarPanel` : même en-tête, même prop `onClose`.

Fichier : `src/components/community/synthese/trophic/ConstellationTab.tsx`

- Passer `onClose={() => { setSelected(null); setFocusGroup(null); }}` aux deux panneaux.
- Aucun changement de logique métier, aucun changement de layout du SVG.

## Hors scope

- Refonte du panneau (drawer, modale) — disproportionné.
- Modifications des onglets « Spirale du Vivant » / « Réseau Vivant ».
- Logique de classification trophique (déjà traitée).
