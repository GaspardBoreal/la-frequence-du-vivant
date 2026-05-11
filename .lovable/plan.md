## Objectif
Faire en sorte que la Consoude de Russie (*Symphytum × uplandicum*) raconte la même histoire sur **toutes** les marches : catégorie unique **auxiliaire**, conforme aux listes officielles EEE (UE 1143/2014, arrêté français), tout en supprimant un bug qui pourrait reproduire l'incohérence sur d'autres espèces.

## 1. Correction des données (migration SQL)

Deux `UPDATE` ciblés sur `exploration_curations` :

- **Exploration `70fcd8d1` ("DEVIAT Marcher sur un sol qui respire")** : passer `category` de `eee` → `auxiliaire`.
- **Exploration `20dd3be8` ("Jardin Monde")** : réécrire `entity_id` de la clé composite `"Symphytum × uplandicum | … | Russian Comfrey | 2"` vers le nom scientifique propre `"Symphytum × uplandicum"` (la `category=auxiliaire` est conservée).

Audit complémentaire : `SELECT … WHERE entity_id LIKE '% | %'` pour détecter d'autres curations malformées et les corriger en lot (re-extraire le 1er segment avant ` | `).

## 2. Enrichissement du Knowledge Base

Ajouter dans `src/data/species-knowledge-base.json` :

```json
"Symphytum × uplandicum": {
  "primary": "auxiliaire",
  "secondary": ["bioindicatrice"],
  "notes": "Consoude de Russie, hybride S. officinale × S. asperum. Engrais vert, mellifère, accumulatrice de potasse. Non listée EEE (règlement UE 1143/2014, arrêté français)."
},
"Symphytum": {
  "primary": "auxiliaire",
  "notes": "Genre Consoude — fallback genre."
}
```

→ Garantit un fallback cohérent même en l'absence de curation éditoriale.

## 3. Correctif produit : empêcher les `entity_id` composites

**Cause** : l'UI de curation (à identifier — vraisemblablement dans les composants de L'œil sous `src/components/...curation...` qui consomment des "alias keys" du type `${scientificName} | ${name} | ${commonName} | ${count}`) enregistre la clé d'agrégation au lieu du `scientificName` canonique.

**Fix** :
- Localiser le `upsert` vers `exploration_curations` qui passe `entity_id`.
- Toujours normaliser : `entity_id = scientificName.trim()` (et jamais la clé d'alias).
- Ajouter une garde côté écriture : si `entity_id.includes(' | ')`, ne prendre que `split(' | ')[0]`.

Optionnel défensif : ajouter un trigger `BEFORE INSERT/UPDATE` sur `exploration_curations` qui nettoie `entity_id` quand `entity_type='species'` (sécurité ceinture-bretelles).

## 4. QA

- Recharger `/marches-du-vivant/mon-espace/exploration/20dd3be8…` et vérifier que la Consoude apparaît bien dans le bucket **Auxiliaires** (et plus dans EEE).
- Recharger `/…/exploration/70fcd8d1…` : même résultat — Auxiliaire, pas EEE.
- Vérifier qu'aucune autre espèce ne disparaît des compteurs (le `bucketSensibleSpecies` reste à une catégorie primaire unique, conforme à la mémoire `Core` "Sobriété informationnelle").
- Lancer la requête d'audit : 0 ligne avec `entity_id LIKE '% | %'`.

## Hors-scope
- Refonte de la taxonomie KB pour d'autres espèces.
- Modifications UI des fiches espèce / carrousel.
- Backfill d'historique des marches autres que les 2 explorations citées (sera couvert automatiquement par le nettoyage en lot du §1).
