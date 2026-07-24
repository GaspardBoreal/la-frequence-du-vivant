# Harmoniser les vignettes du menu "Changer d'espace"

## Constat
Dans `src/components/community/AppSwitcher.tsx`, les vignettes des propriétés utilisent un petit bloc maison (`<img>` brut + fallback `TreePine`) qui apparaît vide/moche quand `photo_hero_url` est absent ou cassé.

À l'inverse, `AppChoiceDialog` (pop-up de connexion) utilise déjà `ProprieteTile` avec sa cascade robuste : photo hero → photo d'un event lié → monogramme doré sur gradient signature + badge `TreePine`.

## Correctif
1. **`src/components/community/AppSwitcher.tsx`** :
   - Importer `ProprieteTile` (`@/components/community/ProprieteTile`).
   - Remplacer la `<div class="w-9 h-9 …">` interne du bouton propriété par `<ProprieteTile propriete={p} className="w-9 h-9 rounded-md" />` (taille réduite pour le menu déroulant).
   - Conserver le reste (label, badge Principal, ville · rôle, check actif).

2. **`src/components/community/ProprieteTile.tsx`** (si besoin) :
   - Vérifier que le composant accepte une taille compacte via `className` (rayons, gradient, `Sparkles`/monogramme lisible à 36px). Si le monogramme est trop grand à 36px, ajouter une prop `size?: 'sm' | 'md' | 'lg'` avec ajustement typographique (initiales `text-xs` en `sm`) sans casser l'usage existant dans `AppChoiceDialog`.

Aucune autre modification, aucun changement de logique métier.
