# Correctif — source de vérité des marcheurs

## Diagnostic

Je m'étais trompé de table. La liste réelle des marcheurs d'un événement vit dans `marche_participations(user_id, marche_event_id)` — c'est elle qui alimente l'onglet "Marcheurs" de la Synthèse. La table `exploration_marcheurs` est plus restrictive et ne contient pas tout le monde.

Vérification sur l'événement DEVIAT `df85910e-82da-4ef7-98d2-d4c827d1d0ec` : **10 marcheurs validés**, dont les 8 du fichier Excel (les 4 manquants précédemment + les 4 déjà importés).

## Correctifs

### 1. Migration : remplacer la fonction de matching

```sql
CREATE OR REPLACE FUNCTION public.match_marcheur_for_event(_name text, _event_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT mp.user_id
  FROM public.marche_participations mp
  JOIN public.community_profiles cp ON cp.user_id = mp.user_id
  WHERE mp.marche_event_id = _event_id
    AND lower(extensions.unaccent(coalesce(cp.prenom,'') || ' ' || coalesce(cp.nom,'')))
        = lower(extensions.unaccent(_name))
  LIMIT 1;
$$;
```

Source unique : `marche_participations` jointe à `community_profiles` pour le nom.

### 2. Import des 4 témoignages restants

Insertion via migration (avec `ON CONFLICT DO UPDATE`) :
- Laurence Karki → `0c9a3fbe-20d0-4989-bde9-24678768e85f`
- Victor Boixeda → `7a5cc1a2-301c-4070-ae62-248558ce0eec`
- Jean-Paul Chiron → `1f211844-7d66-479c-8e01-4f3180b3ac24`
- Jean-François Servant → `52650e0c-76ec-4aa5-a405-6969a9ec03c6`

Tous rattachés à l'événement `df85910e...`. Les 4 déjà importés restent inchangés.

### 3. Suite (inchangée)

Une fois ce correctif appliqué :
- Hook `useExplorationTestimonies(explorationId)` (jointure `event_testimonies` ↔ `marche_events.exploration_id`)
- Onglet "Témoignages" dans `EventBiodiversityTab.tsx` entre Taxons et Analyse IA
- 4 modes : Mur de cartes / Carrousel / Nuage de mots cliquable / Constellation
- Curation owner+admin (édition + toggle publication)
- Tracking ChatBot (`data-chat-section="temoignages"`)

Désolé pour le détour — j'aurais dû vérifier la source affichée à l'écran avant.
