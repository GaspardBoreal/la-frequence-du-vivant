
# ICG · Concordance · Narration IA — Étape 3 « J'identifie »

## 1. Le calcul ICG est faux (vérifié)

La méthode D.S. (page 12) impose :
- 4 critères × 2 niveaux = **8 lignes**, score max **16 points fixes**
- OUI = 2 pts · PARTIEL = 1 pt · NON = 0 pt
- **ICG = (score ÷ 16) × 100** — le dénominateur est toujours 16

Trois écarts constatés dans `src/lib/plantIndicatorKb.ts` (`computeConcordanceDetail`) :

**a) Dénominateur variable.** Le code retire les lignes « donnée absente » du maximum (`max = active.length * 2`). Sur la capture : 2 lignes absentes → 12/12 → **ICG 100 %**. Selon la méthode, ces lignes valent 0 point sur 16 → 12/16 → **ICG 75 %**. Un diagnostic incomplet ne peut pas afficher une cohérence parfaite.

**b) Seuils trop indulgents.** `gap <= 1 → OUI` fait passer « Non observé » (0) face à « Très faible » (1) en CONCORDANT, et « Marqué » (3) face à « Moyen » (2) également en CONCORDANT. La méthode raisonne sur 3 niveaux (Faible / Moyen / Fort) : niveau identique = OUI, un cran d'écart = PARTIEL, deux crans = NON.

**c) Absence lue comme accord.** Une ligne où le sol ne dit rien *et* la flore ne dit rien est actuellement comptée OUI ; elle doit être neutre (0 pt) et signalée.

### Correction proposée
- Normaliser sol et flore sur la même échelle 3 niveaux (Faible / Moyen / Fort) avant comparaison.
- Table de verdict : écart 0 → OUI (2) · écart 1 → PARTIEL (1) · écart 2 → NON (0) · donnée absente → NON ÉVALUÉ (0 pt, compté dans les 16).
- `icg = round(points / 16 * 100)`, conforme à la méthode, avec les 3 bandes officielles : 80-100 bonne cohérence · 60-79 cohérence moyenne · 0-59 faible cohérence.
- Ajout d'un **indice de fiabilité** distinct (`lignes évaluées / 8`) affiché sous l'ICG : il explique honnêtement qu'un ICG bas peut venir d'un manque de données plutôt que d'une divergence réelle — et pousse à compléter l'Étape 2.
- Contrôle de non-régression : recalcul de l'exemple du guide (6 oui, 1 partiel, 1 non = 14 pts → ICG 88).

## 2. Section 03 · Concordance sol ↔ flore — direction chromatique

Aujourd'hui la table est monochrome crème/vert, les pastilles « CONCORDANT » et « DONNÉE ABSENTE » ont le même gris : l'œil ne hiérarchise rien.

Refonte :
- **Codage par critère** en filet vertical coloré à gauche de chaque ligne, avec les tokens existants : Eau (bleu-vert `--ds-eco-eau`), Texture (terre), Nutrition (or `--ds-eco-nutri`), pH (prune). Les 2 pôles d'un même critère sont regroupés visuellement par une bande commune.
- **Deux jauges miroir** par ligne, remplaçant les mots secs : à gauche la lecture du sol (dégradé minéral), à droite la lecture de la flore (dégradé chlorophylle), remplies sur 3 crans. La concordance devient lisible *d'un coup d'œil* — deux barres alignées = accord.
- **Pastilles de verdict** contrastées et sémantiques : OUI = émeraude pleine, PARTIEL = ambre, NON = terracotta, NON ÉVALUÉ = contour pointillé neutre (jamais coloré comme un succès).
- **Anneau ICG vivant** : couleur de l'anneau pilotée par la bande (émeraude / ambre / terracotta), animation de remplissage, et sous-titre « x oui · y partiel · z non · n non évalué — score /16 ».
- Lignes en alternance très légère + survol qui met en avant la ligne, pour la lecture d'un tableau à 8 entrées.
- Tokens ajoutés dans `src/index.css` (verdicts + pôles manquants), aucun code couleur en dur ; rendu vérifié en impression A4 (aplats compatibles noir & blanc grâce aux crans).

## 3. Narration du diagnostic pré-rédigée par l'IA du site

Aujourd'hui le bloc « Narration » propose une seule phrase mécanique (`narratePoleScores`) et le rapport imprimé affiche « — Non renseigné — ».

Proposition : un bouton **« Laisser l'IA rédiger la lecture du site »** dans le bloc Narration (et dans la synthèse), qui appelle une nouvelle fonction serveur nourrie de **tout ce que l'application sait déjà de cette propriété** :

- Étape 1 « J'observe » : contexte, relief, exposition, vent, eau, végétation, ressenti sensoriel
- Étape 2 « J'analyse le sol » : structure, texture, pH, signes de vie, prélèvements
- Étape 3 : cortège révélé (espèces, strates), les 8 pôles avec leurs points, l'ICG corrigé et son indice de fiabilité
- Biodiversité mesurée sur place : nombre d'espèces, règnes, espèces marquantes, marches liées (`get_propriete_biodiversity`)
- Cadastre / parcelles et nom de la propriété

Sortie en 4 paragraphes courts, prêts pour un rapport client :
1. **Ce que le lieu raconte** (lecture sensible et ancrée)
2. **Ce que la flore révèle du sol** (les 4 critères, argumentés par les plantes réellement cochées)
3. **Concordance et niveau de confiance** (explicite l'ICG, et dit franchement ce qui manque)
4. **Points de vigilance & pistes pour la palette** (ouverture vers l'Étape 5)

Garde-fous : l'IA ne cite **que** les espèces effectivement observées, ne produit aucun chiffre qu'elle n'a pas reçu, et le texte arrive en **suggestion éditable** — le professionnel garde la main, un bouton « Régénérer » et un « Adopter ce texte » l'insèrent dans la conclusion. Deux tonalités au choix : *Rapport client* (sobre, argumentatif) et *Récit sensible* (écriture Fréquence du Vivant).

## Détails techniques

- `src/lib/plantIndicatorKb.ts` : réécriture de `computeConcordanceDetail` (normalisation 3 niveaux, dénominateur 16, statut `na` neutre), ajout de `reliability` et `band` dans `ConcordanceDetail`.
- `src/components/propriete/identify/blocks/ConcordanceBlock.tsx` : nouvelle table à jauges miroir, filets par critère, pastilles de verdict, anneau ICG coloré, encart fiabilité.
- `src/components/propriete/identify/FloraPictos.tsx` : `IcgRing` reçoit une couleur de bande.
- `src/components/propriete/identify/IdentifySummary.tsx` : synthèse et version imprimée alignées sur le nouveau calcul + nouvelles couleurs (rendu print statique, sans animation).
- `src/index.css` : tokens `--ds-verdict-oui / -partiel / -non / -na` et pôles manquants.
- Nouvelle fonction Edge `propriete-diagnostic-narration` (Lovable AI Gateway, `google/gemini-3.6-flash`), assemblant le contexte via les données déjà chargées + `get_propriete_biodiversity`, avec gestion explicite des erreurs 429 / 402.
- Nouveau hook `useProprieteNarration` et évolution de `NarrativeBlock.tsx` (états chargement / suggestion / adoption / régénération, micro-copies inspirantes).
- Aucune modification des URL publiques ni du reste du parcours.
