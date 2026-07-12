## Diagnostic

Oui, **389 lignes dans le CSV est normal** — mais c'est aussi le signe que l'export actuel prête à confusion.

Le CSV que tu as exporté ne contient QUE la section `=== OBSERVATIONS BRUTES PAR MARCHE ===` (case « Observations brutes » cochée, case « Synthèse biodiversité » décochée). Cette section liste **1 ligne = 1 espèce × 1 marche** : avec ~38 espèces uniques et ~10 marches aux rayons qui se chevauchent, on obtient logiquement ~380 lignes de doublons géographiques (la même espèce réapparaît sous chaque marche qui la capte).

Le Word, lui, s'appuie sur le RPC dédupliqué → 38 espèces, c'est cohérent.

**Deux vrais problèmes UX cependant :**

1. Quand l'utilisateur décoche « Synthèse » et coche « Brutes », le CSV commence par un avertissement qui renvoie « à la section SYNTHÈSE ci-dessus »… qui n'existe pas dans le fichier.
2. Un CSV mono-fichier mélange mal 4 sections (Participants / Marches / Synthèse / Brutes). Illisible dans Excel.

## Proposition

### 1. Corriger l'export CSV actuel (rapide, haut impact)

- **Toujours injecter un en-tête « Résumé » en tête de CSV** dès qu'une section biodiversité est exportée, avec les chiffres dédupliqués du RPC :
  ```
  === RÉSUMÉ BIODIVERSITÉ ===
  Événement, Espèces uniques, Faune, Flore, Champignons, Autres, Nb marches, Nb observations brutes
  Château Boutinet, 38, 12, 24, 2, 0, 10, 380
  ```
- **Reformuler l'avertissement de la section brutes** pour ne plus référencer une section absente :
  ```
  # ⚠ Cette section contient 380 lignes pour 38 espèces uniques (facteur ×10 dû aux rayons chevauchants).
  # Pour le compte d'espèces uniques, voir la section RÉSUMÉ en tête de fichier.
  ```
- **Ajouter une colonne « Chevauchements »** dans les brutes : nombre de marches où l'espèce apparaît (2, 3, 5…). L'utilisateur voit immédiatement pourquoi il y a autant de lignes.
- **Ajouter une section `=== CHEVAUCHEMENTS ESPÈCES ×  MARCHES ===**` (matrice compacte) qui liste, par espèce, la liste des marches où elle est captée. Rend le doublonnage lisible au lieu de suspect.

### 2. Passer d'un CSV mono-fichier à un **XLSX multi-feuilles** (option recommandée)

Un vrai `.xlsx` avec `xlsx` (déjà présent dans le projet via `pack-vivant`) :

- Feuille **Résumé** : KPIs événement + tableau par marche (nb espèces uniques, nb partagées)
- Feuille **Participants**
- Feuille **Marches**
- Feuille **Biodiversité — Synthèse** (38 lignes dédupliquées, alignée Carte/Carnet)
- Feuille **Biodiversité — Brutes par marche** (les 380 lignes, avec colonne Chevauchements)
- Feuille **Chevauchements** (matrice espèce × marches)

Bénéfice : chaque section a son onglet, plus aucune confusion, filtrable/triable dans Excel, format pro pour restitution partenaire.

### 3. Ajuster la UI du panneau

- Renommer le toggle « Observations brutes » → **« Observations brutes par marche (avancé — analyse spatiale) »** avec un badge « 380 lignes attendues » calculé dynamiquement au survol.
- Ajouter une info-bulle expliquant chevauchement de rayons en 1 phrase.
- Nouveau toggle **« Format XLSX (recommandé) / CSV »** au-dessus des cases sections.

## Détails techniques

**Fichiers touchés :**

- `src/utils/eventExportUtils.ts` : nouveau bloc `=== RÉSUMÉ BIODIVERSITÉ ===` toujours en tête ; enrichir `rawSpeciesPerMarche` avec `overlapCount` ; nouvelle section `Chevauchements` ; générateur XLSX parallèle au CSV via `xlsx` (`writeFile` multi-sheets).
- `src/components/admin/EventExportPanel.tsx` : sélecteur format CSV/XLSX, libellés et tooltips enrichis, calcul dynamique du nombre de lignes brutes attendues.
- Le RPC `get_exploration_species_export` renvoie déjà `by_source` + `species[]` avec `in_snapshot/in_marcheur` → suffisant pour Résumé & Chevauchements sans nouvelle migration SQL.

**Aucune migration SQL nécessaire.** Purement front + utils.

Voie retenue :

**(B) Pro** : (A) + génération XLSX multi-feuilles au choix dans le panneau (recommandé pour restitution partenaires type VDT).