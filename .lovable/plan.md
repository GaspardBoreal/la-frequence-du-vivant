# Voir le poids de chaque espèce sur l'ICG, dans le tri du cortège

Aujourd'hui le tri du cortège dit *quel statut* porte chaque espèce, mais pas *ce qu'elle pèse*. Le jury des espèces, plus bas dans l'écran, connaît déjà cette contribution (ICG recalculé sans l'espèce) — elle n'est simplement jamais montrée à l'endroit où l'on décide. On ramène le poids dans la main de celui qui trie.

## 1. La barre de poids sur chaque ligne

Chaque puce du cortège gagne, entre le nom et le sélecteur de statut, une **jauge signée** : un axe central, une barre qui pousse à droite en vert quand l'espèce confirme la lecture du sol, à gauche en terre cuite quand elle la contredit, un simple point gris quand elle ne déplace rien. La longueur est proportionnelle à la contribution la plus forte du lot — la hiérarchie se lit d'un coup d'œil, sans lire un seul chiffre.

À droite de la jauge, la valeur signée en petit (`+3`, `−2`, `—`), en chiffres tabulaires pour que les lignes s'alignent.

```text
🌿 Ortie dioïque   ×4      ▇▇▇▇▇◼            −4   [Cons][Reti][Nouv][Écar]
🌿 Achillée        ×2            ◼▇▇         +2   [Cons][Reti][Nouv][Écar]
🌿 Lierre          ×7               ◼        —    [Cons][Reti][Nouv][Écar]
```

## 2. Un tri par le poids

En tête du bloc, deux modes d'ordre : **Par influence** (les espèces les plus lourdes en haut, positives puis négatives) ou **Alphabétique**. Par influence est le mode par défaut : la première chose que l'on voit est ce qui fait bouger le score.

## 3. Le détail au clic — « pourquoi cette espèce pèse »

Un clic sur la jauge déplie, sous la ligne, une bande fine et calme :

- les pôles écologiques sur lesquels l'espèce se prononce (Frais, Argile, Riche, Acide…) avec son intensité,
- pour chacun, le verdict actuel du pôle (accord / un cran / discordant) et le gain apporté,
- une phrase en clair : « Sans elle, le pôle Richesse repasserait en accord : elle coûte 3 points d'ICG. »

Un seul détail ouvert à la fois, refermé par un second clic — la liste ne se transforme jamais en mur.

## 4. La balance du lot, en tête

Au-dessus de la liste, une **balance horizontale** : la somme des contributions positives à droite, négatives à gauche, empilées en segments colorés larges de leur poids ; chaque segment est survolable et surligne sa ligne dans la liste. Sous la balance, une phrase de synthèse déjà produite par le jury (« 5 espèces confirment la lecture du sol, 3 la contredisent »).

## 5. Le poids réagit au tri

Quand on passe une espèce en *Retirée* ou *Écartée* en brouillon, sa jauge se vide et devient fantôme (contour pointillé) : on voit immédiatement le poids que l'on s'apprête à retirer du score. Les jauges des autres espèces ne bougent pas tant que la validation n'a pas eu lieu — on ne recalcule pas tout le lot à chaque clic, la lecture reste stable.

La barre de brouillon existante (« 4 changements · ICG 58 → 64 ») garde son rôle : elle donne le résultat, les jauges donnent la cause.

## Détails techniques

- `src/lib/chantierIcg.ts` : réutiliser `speciesIcgJury(pool, soil)` tel quel — aucun nouveau barème. Le résultat est indexé par nom scientifique normalisé (`speciesKey`) pour être joint aux `CortegeEntry`. Ajouter, sur `SpeciesVerdict`, la raison textuelle par pôle (verdict avant/après retrait) déjà calculable depuis `computeConcordanceDetail`.
- `ChantierOverlay.tsx` : le jury « avant » est déjà calculé pour `SpeciesJury` ; le passer en prop à `CortegeTriage` plutôt que de le recalculer.
- Nouveau composant `SpeciesWeightBar.tsx` (jauge signée + valeur) et `CortegeBalance.tsx` (balance de tête), dans `src/components/propriete/chantier/`.
- `CortegeTriage.tsx` : ajout du mode d'ordre, de l'état `openDetailKey`, et du rendu fantôme pour les statuts *retirée* / *écartée* en brouillon. Aucun changement de la logique de commit.
- Couleurs : réutilisation stricte des tons existants (`#4f8a5b`, `#b4553f`, `#8b8578`, or `#c8a24a`) et de `SPECIES_STATUS_TONE`. Aucune nouvelle couleur.
- Noms français toujours via `labelFor` / `useWaypointFrenchNames`.
- Aucun changement de base de données.
