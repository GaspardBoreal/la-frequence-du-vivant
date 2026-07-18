## Problème

Sur la proposition 2 (Organic), le plateau CTA « Rejoignez la communauté des Marcheurs du Vivant » se superpose visuellement à la signature « la-frequence-du-vivant.com » (et au wordmark « Les Marches du Vivant » quand présent). Résultat : deux blocs concurrents en bas-gauche.

## Proposition (créative, sans perdre l'identité)

Plutôt que masquer la signature sur 3 variantes/4, **fusionner le CTA et la signature en un seul objet cohérent** quand le CTA est actif — la signature devient le pied du CTA, pas un doublon.

### Règle d'affichage unifiée

Quand `ctaEnabled = true` :
- **Un seul plateau** en bas-gauche contenant, empilés dans l'ordre :
  1. Micro-wordmark discret « Les Marches du Vivant · Fréquence du Vivant » (petit, 60% opacité, tracking large)
  2. Titre CTA doré « Rejoignez la communauté »
  3. URL `la-frequence-du-vivant.com` en pied (petit, or pâle)
- Le bloc signature autonome (celui qui dessine actuellement le wordmark + URL en bas-gauche) est **supprimé** dans ce cas — plus de collision possible.

Quand `ctaEnabled = false` :
- Comportement actuel inchangé : wordmark + URL en bas-gauche autonome.

### Détails visuels du plateau fusionné

- Fond noir semi-transparent (comme actuel), bordure or 1px, coins arrondis.
- Séparateur fin doré 1px entre le micro-wordmark et le titre CTA pour rythmer.
- Hauteur ajustée dynamiquement (3 lignes au lieu de 2).
- Anti-collision existant conservé : test des 8 ancres × 2 tailles vs images/QR/titre événement.

### Cas « événement sélectionné »

Le titre événement (aligné bas-QR à droite) reste inchangé — il ne partage plus l'espace bas-gauche.

## Fichier concerné

- `src/components/wallpaper-studio/renderer/wallpaperCanvas.ts`
  - `drawCommunityCta` : ajouter la ligne wordmark + la ligne URL dans le plateau, recalculer la hauteur.
  - `drawSignature` : si `ctaEnabled`, ne dessiner que le titre événement (côté QR) et sauter le bloc wordmark/URL bas-gauche.
  - Ordre d'appel dans `render` : passer `ctaEnabled` à `drawSignature`.

## Alternative (ta proposition)

Si tu préfères ta version — wordmark uniquement sur variante 1, absent sur 2/3/4 — c'est faisable en 2 lignes (flag `variantIndex === 0`). Moins élégant à mon sens car la variante 1 devient incohérente avec les autres, mais 100% valide.

**Dis-moi laquelle tu veux :** (A) plateau fusionné unifié, (B) wordmark uniquement sur variante 1, ou (C) autre idée.