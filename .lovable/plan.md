## Compris

Remettre l'index vertical à droite (position d'origine), mais garantir que chaque `StratPanel` ("Panneau vivant") passe **au-dessus** de l'index quand il croise sa zone — pour que les pastilles disparaissent proprement derrière le panneau au lieu de flotter par-dessus.

## Correction

Modification unique dans `src/pages/ImmersiveGardenFiche.tsx` :

1. **`StratIndicator` (l.478-485)** : repasser à `right-4`, retirer le fond flouté ajouté précédemment, et laisser `z-20` (bas dans la pile).
2. **`IndicatorDot`** : rétablir `justify-end` et l'ordre label → pastille.
3. **`StratPanel`** (`src/components/immersive-garden/StratPanel.tsx`) : ajouter `relative z-30` au conteneur `motion.div` racine, de sorte que le panneau (déjà `backdrop-blur-xl`) passe au-dessus de l'index `z-20` dès qu'il chevauche sa zone.

Aucun changement de logique, de données ou de backend.

## Vérification

- Rechargement `/jardin/dbaf6db0-...` en desktop.
- Screenshots Playwright aux 3 sections (Canopée, Arbustive, Rhizosphère) pour confirmer : l'index est à droite, mais masqué par le Panneau vivant sur les sections 1 et 2.
