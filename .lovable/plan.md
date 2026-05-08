## Contexte

Aujourd'hui, quand "L'Œil" (vue de curation des espèces) affiche une espèce remarquable comme le **Carabe cuirassé**, on voit la liste des **observateurs citoyens** (iNaturalist, eBird…) — par exemple "Sophie D" et "Laurence Karki" — mais **rien ne relie automatiquement** ces noms à des marcheurs de l'exploration. Du coup, leur Indice de Sentinelle ne crédite pas cette détection précieuse.

Un outil existe déjà dans `MarcheurObservationsManager` (admin), mais il faut sortir de la vue de curation, choisir le marcheur, retrouver l'espèce, etc. Trop d'étapes.

## Proposition : bouton "Attribuer à un marcheur" directement dans L'Œil

Un seul geste depuis la fiche espèce, accessible aux **ambassadeurs, sentinelles et administrateurs**.

### Parcours utilisateur (3 clics)

1. Dans **L'Œil → Sélection finale / À réviser / Suggestions**, sur chaque carte d'espèce déjà étendue (panneau "Observateurs citoyens"), un nouveau bouton apparaît à côté de chaque nom listé : **« Attribuer à un marcheur »** (icône `UserPlus`).
2. Au clic → drawer/modal léger qui affiche :
   - Le nom de l'espèce + nom commun FR + une vignette (réutilise `SpeciesName`).
   - Le nom citoyen détecté ("Sophie D") en pré-sélection floue : on cherche dans les marcheurs de l'exploration un nom approchant via la même normalisation NFD que `mem://technical/community/identity-matching-logic`.
   - Une **liste cochable des marcheurs de l'exploration** (multi-sélection — utile pour Sophie D + Laurence Karki ensemble).
   - Un sélecteur "**Marche concernée**" : par défaut la marche d'où vient l'observation source ; sinon liste déroulante des marches de l'exploration.
   - Un bouton **« Confirmer l'attribution »**.
3. À la confirmation :
   - Insertion dans `marcheur_observations` d'une ligne par marcheur sélectionné `(marcheur_id, marche_id, species_scientific_name, observation_date, notes="Attribution depuis L'Œil par <prénom curateur>")`.
   - Toast "Carabe cuirassé attribué à 2 marcheurs — Indice de Sentinelle mis à jour".
   - Invalidation des React Query keys : `exploration-marcheurs`, `exploration-participants`, `marcheur-impact-snapshots` → les scores se recalculent automatiquement (l'Indice de Sentinelle est dérivé en mémoire depuis `speciesObserved`).

### Garde-fous

- **Visibilité du bouton** : seulement si `useCommunityProfile().role` ∈ `{ambassadeur, sentinelle, admin}`. Pour les autres : rien ne change.
- **Anti-doublon** : avant insertion, on vérifie si la paire (marcheur, espèce, marche) existe déjà dans `marcheur_observations` ; si oui on saute silencieusement.
- **Traçabilité** : le champ `notes` enregistre qui a fait l'attribution et depuis où ("L'Œil — curation").
- **RLS** : les policies actuelles autorisent tout authentifié à insérer. Resserrement recommandé via une RPC `SECURITY DEFINER` `attribute_species_to_marcheurs(...)` qui vérifie le rôle côté serveur (cohérent avec le reste de l'app — voir `mem://auth/edge-function-admin-security-logic`). C'est la seule modif backend.

### Bonus UX optionnel (même drawer)

- **Suggestion automatique** : si le prénom détecté ("Sophie D") matche par préfixe + initiale un marcheur de l'exploration ("Sophie Dupont"), on coche la case par défaut + petit badge "Correspondance probable".
- **Aperçu d'impact** : sous chaque marcheur, mini-ligne "Indice : 32 → 36 (+4)" calculée à la volée avec `computeSentinelleIndex` avant validation.

## Détails techniques

- **Nouveau composant** : `src/components/community/insights/curation/AttribuerObservationDialog.tsx`.
- **Modification** : `OeilCuration.tsx` (intégration du bouton dans le rendu des observateurs ; déjà au bon endroit dans la card étendue).
- **Nouvelle migration** : RPC `attribute_species_to_marcheurs(p_exploration_id, p_marche_id, p_species text, p_marcheur_ids uuid[])` qui :
  - Vérifie via `has_role(auth.uid(), 'admin')` OU rôle communauté ∈ ambassadeur/sentinelle.
  - Boucle insertion idempotente (`ON CONFLICT DO NOTHING` après ajout d'un index unique `(marcheur_id, marche_id, species_scientific_name)`).
  - Retourne le nombre de lignes créées.
- **Hook** : `useAttribuerObservation()` (mutation) + invalidations queries.
- **Recalcul scores** : aucun travail explicite — `MarcheurImpactPanel` recalcule `computeSentinelleIndex` à chaque rendu à partir de `marcheur.speciesObserved`. L'invalidation des hooks suffit.

## Hors scope

- Pas de changement à la formule de l'Indice de Sentinelle (V2 conservée).
- Pas de notification e-mail au marcheur attribué (peut être ajouté plus tard).
- Pas de "désattribuer" depuis L'Œil — ça reste dans l'admin existant.
