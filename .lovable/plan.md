## Diagnostic — réponse directe

**Non, actuellement le contexte du chatbot ne contient AUCUNE information précise sur les marches** (ni nom, ni GPS, ni étapes, ni waypoints, ni traces).

Vérification faite côté code et base :

1. **RPC `get_admin_entity_context(_type='marche_event' | 'exploration')`** — alimente le bloc « Fiche en cours de consultation » envoyé à Gemini. Elle retourne :
   - `event`, `exploration`, compteurs (`exploration_marches_count`, `parties_count`)
   - `participants`, `recent_participants`, `media_aggregates`
   - `biodiversity` agrégée, `organisateurs`
   - **JAMAIS la liste des marches** de l'exploration, **ni leurs `nom_marche`, `ville`, `latitude`, `longitude`, `distance_km`, `ordre`**, **ni les waypoints/étapes**.

2. **Slice "Carte" via `data-chat-*`** — seul `BiodiversityEvolutionChart.tsx` publie un slice. La page Carte (`ExplorationLayout` / onglet Carte) **n'expose rien** : ni les 15 étapes visibles à l'écran, ni les 116 espèces, ni la zone géographique.

3. **Conséquence** — quand l'IA répond « cible les zones de replats… sur ton tracé de 10 km », elle improvise : elle n'a vu ni le tracé, ni les coordonnées, ni les étapes. Les associations espèces ↔ étapes (« près des Orchidées pyramidales ») sont également hallucinées car `marcheur_observations` / `species_data` ne sont pas géolocalisées par étape dans le contexte envoyé.

## Plan d'enrichissement du contexte chat

Objectif : permettre à l'IA de raisonner sur la géographie réelle de la marche (étapes numérotées, GPS, distances, biotopes par zone) sans exploser le payload.

### 1. Étendre `get_admin_entity_context` (marche_event + exploration)

Ajouter une clé `marches` (liste compacte, ordonnée) :

```json
"marches": [
  {
    "ordre": 1,
    "id": "...",
    "nom": "Boucle de Bessac",
    "ville": "Deviat",
    "lat": 45.4523,
    "lon": 0.0612,
    "distance_km": 9.4,
    "etapes_count": 15,
    "biotopes": ["lisière de chênaie","fond de vallon humide"],
    "species_top": ["Iris faux-acore","Orchidée pyramidale","Noisetier"]
  }
]
```

Et une clé `waypoints` compacte (échantillonnée, max ~20 points par marche) :

```json
"waypoints": [
  { "marche_ordre": 1, "etape": 1, "lat": 45.451, "lon": 0.062, "label": "Départ - parking" },
  { "marche_ordre": 1, "etape": 7, "lat": 45.456, "lon": 0.058, "label": "Replat humide" }
]
```

Source SQL :
- `exploration_marches` JOIN `marches` ORDER BY `ordre` → noms + GPS + distance
- `marche_waypoints` (si la table existe — sinon `marches.parcours_geojson`) → étapes décimées si > 20
- Top espèces par marche : `marcheur_observations` GROUP BY `marche_id` (LIMIT 5) + jointure occurrences snapshots

Garde-fous payload :
- max 15 marches/exploration listées en détail (les autres en compteur)
- waypoints décimés (Douglas-Peucker simplifié ou pas constant)
- pas de geojson brut — uniquement lat/lon arrondis à 4 décimales

### 2. Publier un slice « Carte » côté frontend

Dans la vue Carte de l'onglet (`ExplorationLayout` / composant carte marcheur) :

```ts
chatPageContext.setSlice('carte', {
  label: 'Carte de l'exploration',
  marches: [
    { ordre, nom, ville, lat, lon, distance_km, etapes_visibles: 15 }
  ],
  etapes_affichees: [...],   // celles réellement à l'écran (zoom courant)
  bbox: { north, south, east, west },
  fond: 'geo' | 'sat' | 'relief' | 'cadastre'
});
```

Avantage : quand l'utilisateur dit « regarde la carte ouverte devant moi », l'IA voit la même chose que lui (les 15 étapes, la zone, le fond).

### 3. Update du super-prompt `community-chat`

Ajouter dans les RÈGLES CONTEXTUELLES :

> 7. Quand l'utilisateur évoque le tracé, les étapes, des lieux précis ou demande des conseils géographiques (« où poser mon micro », « où aller chercher »), utilise **EN PRIORITÉ** la clé `marches[]` et `waypoints[]` de la fiche, et la slice `carte` si présente. **N'invente jamais** un lieu, une étape, un replat ou un vallon qui n'apparaît pas dans ces données.

### 4. Mémoire projet

Créer `mem://features/community/chatbot-geographic-context` documentant que :
- `get_admin_entity_context` expose `marches[]` + `waypoints[]` compacts
- la Carte publie un slice `carte` via `chatPageContext`
- l'IA doit s'appuyer dessus pour tout conseil spatial

## Détails techniques

**Fichiers à modifier :**
- `supabase/migrations/<new>.sql` — `CREATE OR REPLACE FUNCTION public.get_admin_entity_context` (ajouter blocs `marches` + `waypoints` pour `marche_event` ET `exploration`)
- `src/components/community/exploration/<MapTab>.tsx` (ou équivalent onglet Carte) — appeler `chatPageContext.setSlice('carte', …)` avec cleanup
- `src/hooks/useChatPageContext.ts` — vérifier que `setSlice` existe (sinon l'ajouter, pattern identique à `setAvailableAttachments`)
- `supabase/functions/community-chat/index.ts` — étendre le super-prompt (règle 7) + log du nombre de marches/waypoints injectés
- `mem://features/community/chatbot-geographic-context` + index

**Estimation payload supplémentaire :** ~3-6 KB pour une exploration de 10 marches × 20 waypoints décimés. Acceptable (Gemini 3 Flash gère >32K tokens de contexte).

**Non inclus volontairement :**
- géolocalisation espèce-par-espèce (nécessiterait un schéma `marcheur_observations.lat/lon` exploité — à traiter dans un plan dédié)
- traces GPS complètes (trop volumineuses — on garde une décimation)
