## Diagnostic

L'attribution Carabe cuirassé → Sophie D + Laurence Karki a bien été enregistrée en base. Vérification SQL :

```
exploration_marcheurs.id  | prenom   | user_id  | species
ab2ec703… (shadow)        | Sophie   | 58fd…    | Carabus coriaceus ✅
f50e1e2e… (crew)          | Laurence | 0c9a…    | Carabus coriaceus ✅
```

Mais l'empreinte de Sophie affiche **0 auxiliaire / 0 espèce / 0 détection précieuse**. Deux bugs cumulés :

### Bug 1 — Plomberie : les observations du shadow crew ne remontent pas vers le participant communauté

Dans `src/hooks/useExplorationParticipants.ts` :

- la boucle "editorial crew" lit bien `marcheur_observations` et alimente `obsByMarcheur` / `speciesSetByMarcheur`,
- mais elle **skippe** toute ligne crew dont le `user_id` est aussi un participant communauté (`if (m.user_id && participantUserIds.has(m.user_id)) return;`) — pour éviter le doublon visuel,
- puis la boucle "community participants" émet `**speciesObserved: []` et `speciesCount: 0` en dur**, sans jamais regarder `crewIdByUserId.get(cu.user_id)`.

Conséquence : pour tout marcheur communauté possédant un shadow crew (cas créé par la RPC d'attribution), ses espèces attribuées sont invisibles côté `MarcheurWithStats.speciesObserved` → `useMarcheurSensibleSpecies` reçoit `[]` → tous les compteurs sensibles tombent à 0. Même bug dans la boucle "orphan profiles".

### Bug 2 — Classification : `Carabus coriaceus` absent du référentiel

`src/data/species-knowledge-base.json` ne contient ni l'espèce ni le genre `Carabus`. Même une fois le bug 1 corrigé, `bucketSensibleSpecies(['Carabus coriaceus'])` retournerait des buckets vides, donc « 0 auxiliaire ».

Le fallback genre existe déjà dans `classifySpecies` (`src/lib/speciesClassification.ts`) — il suffit d'ajouter une entrée genre `Carabus` pour couvrir tous les Carabidae prédateurs.

## Plan d'action

### 1. `src/hooks/useExplorationParticipants.ts` — propager les observations du shadow crew

Dans l'émission des participants communauté (et orphan profiles), résoudre le `crewId` lié et hériter de ses observations :

```text
const linkedCrewId = crewIdByUserId.get(cu.user_id);
const obs        = (linkedCrewId && obsByMarcheur.get(linkedCrewId)) || [];
const speciesCnt = (linkedCrewId && speciesSetByMarcheur.get(linkedCrewId)?.size) || 0;
…
stats: { ...s, speciesCount: speciesCnt },
totalContributions: total + speciesCnt, // cohérent avec la branche crew
speciesObserved: obs,
crewId: linkedCrewId ?? null,
```

Idem pour la boucle `orphanProfiles`. Aucune autre route impactée : la branche crew pure (sans `user_id` participant) continue d'émettre comme avant.

### 2. `src/data/species-knowledge-base.json` — ajouter le genre `Carabus`

Ajouter une entrée genre (le fallback genre est déjà géré par `classifySpecies`) :

```json
"Carabus": {
  "primary": "auxiliaire",
  "secondary": ["indigene", "bioindicatrice"],
  "evidence": [{
    "source": "INRAE",
    "ref_code": "Carabidae-prédateurs",
    "url": "https://www6.inrae.fr/encyclopedie-pucerons/Especes-d-auxiliaires/Carabidae",
    "quote": "Carabidae : prédateurs polyphages des cultures (limaces, larves, pucerons au sol). Bioindicateurs reconnus de la qualité des sols et des bocages."
  }],
  "habitat_dordogne": "Bocage, lisières forestières, prairies, sols vivants",
  "notes": "Genre couvrant toutes les espèces de Carabes (dont Carabus coriaceus, le Carabe cuirassé). Auxiliaire majeur en agroécologie."
}
```

### 3. Vérification

- Ouvrir l'empreinte de Sophie D et Laurence Karki après rechargement du cache (`exploration-participants` a `staleTime: 30s`).
- Attendu : `1 auxiliaire`, `1 espèce`, le bandeau « Détections précieuses » passe à 1 et l'Indice de Sentinelle progresse (≈ +3-4 pts via le bucket sensible + +1 via diversité d'espèces).

## Hors scope

- Pas de changement de la RPC d'attribution (elle écrit déjà correctement).
- Pas de migration SQL.
- Pas de changement UI : les écrans d'empreinte se mettront à jour automatiquement dès que `speciesObserved` sera correctement rempli.