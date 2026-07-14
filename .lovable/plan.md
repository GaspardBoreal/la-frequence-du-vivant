## Compris

Section Rhizosphère : le `StratPanel` est à gauche, donc c'est le **bloc texte de droite** ("Strate 2 — Rhizosphère" / "Le silence fertile des racines" / paragraphe) qui chevauche l'index vertical. Il faut que ce bloc passe lui aussi au-dessus de l'index quand on arrive dessus.

## Correction

Modification unique dans `src/pages/ImmersiveGardenFiche.tsx`, section 2 (l.316-333) : ajouter `relative z-30` au `motion.div` du bloc texte de droite, comme on l'a fait pour `StratPanel`. Ainsi le titre et le paragraphe recouvrent l'index (`z-20`) au lieu de le voir traverser le texte.

Aucun autre changement.

## Vérification

Screenshot Playwright de la section Rhizosphère pour confirmer que l'index n'apparaît plus par-dessus le titre italique.
