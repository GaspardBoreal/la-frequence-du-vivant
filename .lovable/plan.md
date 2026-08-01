## Constat (vérifié sur Massif_V2.pdf + le code)

Le PDF a bien 7 pages : couverture, Planche 1 (plan), Planche 2 (liste de plantation), **Planche 3 (espèces en place, photos OK)**, puis directement **Planche 5 (avant aménagement)**. La Planche 4 « Les espèces proposées et retenues » n'est pas imprimée du tout.

Cause : dans `ChantierPrintLayout.tsx`, cette planche est construite à partir de la seule prop `proposed`, qui vient de `state.proposals` du store du Scénographe (`ScenographeMount` → `ScenographeFullscreen`). Ce tableau n'est peuplé que lorsque l'onglet « Proposées » a été ouvert / la reco IA relancée dans la session ; au moment de l'impression il est vide, donc `retained` et `notRetained` sont vides et `chunk([])` ne rend aucune page.

Pourtant la donnée existe : la Planche 2 du PDF liste 7 espèces avec l'origine « Apport proposé » (Lotier corniculé, serpolet, Achillée millefeuille, Pivoine de Chine, Rosier des chiens, sureau noir, Verveine citronnelle). Elles sont dans `scenario.plantings` avec `origin: 'proposee' | 'libre'` — source fiable, persistée en base, indépendante de l'état de session.

## Correction

**1. Source de vérité = les sujets posés au plan**
- Construire les vignettes « apports » d'abord depuis `plantings.filter(p => p.origin !== 'place')`, dédupliqués par nom scientifique, avec le n° de la liste de plantation, la strate, l'envergure adulte et le nombre de sujets posés.
- Fusionner ensuite les propositions du store non posées (`proposals` non présentes dans les plantings) comme section « en réserve » — si le store est vide, la planche reste complète grâce aux plantings.

**2. Photos garanties**
- Réutiliser exactement le même chemin que la Planche 3 (qui fonctionne) : `useSpeciesThumbs` / `resolveSpeciesThumbs` sur les noms scientifiques des apports, résolus et attendus avant le lancement de l'impression (l'étape de résolution existe déjà dans le flux d'impression — il faut y inclure les noms issus des plantings, pas seulement ceux de `proposals`).
- Repli propre si aucune photo : vignette teintée strate + glyphe, jamais d'image cassée.

**3. Planche jamais silencieuse**
- Si aucun apport n'est posé et aucune proposition disponible, imprimer une planche courte avec la mention « Aucun apport retenu à ce stade » plutôt que de supprimer la page — le professionnel voit que le sujet a été traité.

**4. Numérotation des planches dynamique**
- Les libellés « Planche 1..5 » sont aujourd'hui codés en dur, d'où le saut visible 3 → 5. Calculer le numéro à partir des planches réellement rendues (compteur incrémental), pour que la numérotation reste continue quelles que soient les options cochées.

**5. Lisibilité de la planche apports**
- Deux blocs distincts : « Retenus et posés au plan » (badge doré, n° du plan, nombre de sujets) puis « En réserve » (badge sobre), même grille 3 colonnes que la Planche 3.
- Pied de planche : mention des sources photographiques (iNaturalist / GBIF).

## Détails techniques

- Fichiers touchés : `src/components/propriete/scenographe/print/ChantierPrintLayout.tsx` (dérivation des apports depuis `plantings`, blocs retenus/réserve, numérotation dynamique), `src/components/propriete/scenographe/ScenographeFullscreen.tsx` (inclure les noms scientifiques des plantings dans la liste résolue avant impression).
- Aucun changement de base de données, aucune nouvelle edge function.
- Vérification finale : régénération du dossier, conversion en images et contrôle visuel que la planche « apports » apparaît avec ses 7 espèces photographiées et une pagination continue.

## Hors périmètre

Pas de modification du moteur de propositions IA ni de la liste de plantation (Planche 2), qui est correcte.
