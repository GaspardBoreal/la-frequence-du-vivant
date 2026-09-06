# « Ce que le lieu murmure » — 10 lignes de saisie

Objectif : passer la carte 8 « Ce que j'ai vu, entendu, senti » (analyse sensorielle du site) de 5 à 10 lignes de saisie.

## Ce qui change

Les 5 champs actuels (Sons, Odeurs, Textures, Vues, Ambiance ressentie) sont complétés par 5 nouveaux, dans le même style tuilé :

| # | Champ | Exemple de placeholder |
|---|-------|------------------------|
| 6 | Lumière | ombre sous le tilleul, plein soleil au potager… |
| 7 | Goûts | menthe, mûre, tomate du jardin… |
| 8 | Température & air | fraîcheur du sous-bois, humidité du marais… |
| 9 | Silences | moments de calme, absence de bruit… |
| 10 | Présences remarquées | traces d'animaux, passage, vie du lieu… |

La grille passe de 2 colonnes × ~3 rangées à 2 colonnes × 5 rangées ; le curseur « Ambiance ressentie » reste en bas, pleine largeur. (Le champ existant « ambiance » reste une ligne de texte ; le curseur 0–10 ne change pas.)

## Détails techniques

- `src/components/propriete/observe/observeConfig.ts` : ajout des 5 entrées dans `SENSORIAL_FIELDS` (clés `lumiere`, `gouts`, `temperature`, `silences`, `presences`).
- Aucune migration : les valeurs sensorielles sont stockées en clé/valeur (`values[f.key]`), les nouvelles clés s'enregistrent comme les existantes.
- `SensorialBlock.tsx` : inchangé (il boucle déjà sur `SENSORIAL_FIELDS`).
- Vérifier `ObserveSummary.tsx` : s'il liste les champs en dur, y ajouter les 5 nouveaux pour la synthèse.
- Compilation `npx tsgo --noEmit -p tsconfig.app.json`.
