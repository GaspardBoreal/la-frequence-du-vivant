# Bandeau « Contributeur citoyen » intelligent et personnalisé

Transformer le bandeau statique actuel en **carte vivante** qui distingue les plateformes où le marcheur contribue déjà (avec son avatar et son profil iNaturalist réel) des plateformes encore à rejoindre, avec des invitations ciblées par taxon observé.

## Vision Wahouhh

Au lieu de :
> 🔬 Devenez contributeur citoyen ! [iNaturalist] [eBird]

On affiche :
```
┌─ Vos plateformes citoyennes ──────────────────────────┐
│                                                        │
│ ✓ DÉJÀ ACTIF                                          │
│ ┌─────────────────────────────────────────────┐       │
│ │ 🟢 [avatar] iNaturalist · @gaspardboreal    │       │
│ │    48 obs ici · 312 obs au total · 89 esp.  │       │
│ │    Dernière : Iris faux-acore · 12 mai      │       │
│ │                       [Voir mon profil →]    │       │
│ └─────────────────────────────────────────────┘       │
│                                                        │
│ ⚡ À DÉCOUVRIR                                         │
│ ┌─────────────────────────────────────────────┐       │
│ │ 🐦 eBird                                     │       │
│ │ Vous avez identifié 12 oiseaux. eBird est   │       │
│ │ LA plateforme mondiale pour les oiseaux.    │       │
│ │ Vos chants peuvent enrichir la science.     │       │
│ │                          [Rejoindre eBird]   │       │
│ └─────────────────────────────────────────────┘       │
└────────────────────────────────────────────────────────┘
```

## Étapes

### 1. Edge function `resolve-inaturalist-user`
Nouvelle fonction qui prend une URL d'observation iNat (ex. `https://www.inaturalist.org/observations/123456`) et renvoie :
- `login` (pseudo, ex. `gaspardboreal`)
- `name` (nom affiché)
- `icon_url` (avatar)
- `observations_count` (total mondial)
- `species_count`
- `profile_url`

Logique : extraire l'`observation_id` de l'URL → appeler `https://api.inaturalist.org/v1/observations/{id}` → renvoyer le bloc `user`. Cache mémoire 1h pour éviter de rappeler.

### 2. Hook `useMarcheurCitizenPlatforms`
Nouveau hook qui, à partir des observations déjà chargées du marcheur :
- groupe par `source` → compte locales, dernière obs, kingdom dominant
- pour chaque source détectée, prend la 1ère `originalUrl` valide et déclenche la résolution profil correspondante (iNat seulement pour le moment)
- renvoie `{ active: [{platform, count, lastObs, profile?}], suggested: [{platform, reason, kingdomHint}] }`

### 3. Refonte de `CitizenScienceCTA`
- Reçoit `marcheur` + `observations` en props
- Sépare visuellement deux blocs : **« Vos contributions »** (vert émeraude) et **« Élargir votre voix »** (ambre)
- Carte active : avatar (ou initiales), badge ✓ "Actif", compteur local, total mondial, lien profil
- Carte suggérée : invitation ciblée selon les kingdoms du marcheur (« Vous avez photographié 12 oiseaux → eBird », « 23 plantes → Pl@ntNet », etc.)
- Mini-animation pulse sur le badge ✓
- Plateformes couvertes : iNaturalist, eBird, GBIF (lecture seule, pas de signup), + suggestion conditionnelle Pl@ntNet si beaucoup de Plantae

### 4. Mapping kingdom → invitation
| Kingdom dominant | Plateforme suggérée | Phrase d'invitation |
|---|---|---|
| Animalia (oiseaux) | eBird | « 12 oiseaux identifiés. Rejoignez le 1er réseau ornitho mondial. » |
| Plantae | Pl@ntNet (suggestion supplémentaire) | « 23 plantes observées. Pl@ntNet vous aide à les identifier en 1 clic. » |
| Mixte | iNaturalist (si pas actif) | « Une plateforme universelle pour toutes vos rencontres. » |

### 5. États & dégradés
- **Loading** profil iNat : skeleton avatar + "Chargement de votre profil…"
- **Erreur** résolution : repli sur carte sobre "Plateforme active · X observations" + lien recherche par nom
- **Aucune obs sur la plateforme** : carte invitation par défaut

## Détails techniques

**Fichiers créés**
- `supabase/functions/resolve-inaturalist-user/index.ts` — JWT validé, input `observation_url` ou `observation_id`, cache mémoire 1h, CORS standard.
- `src/hooks/useMarcheurCitizenPlatforms.ts` — agrège `species` (déjà chargé dans `ContributionsSubTab`) + appelle l'edge function via `supabase.functions.invoke` pour iNat uniquement.
- `src/components/community/exploration/impact/CitizenPlatformsCard.tsx` — nouveau composant remplaçant `CitizenScienceCTA`.

**Fichiers modifiés**
- `src/components/community/exploration/MarcheursTab.tsx` :
  - Supprimer `CitizenScienceCTA` (lignes 606-638)
  - Ligne 1342 : remplacer par `<CitizenPlatformsCard marcheur={marcheur} explorationId={...} />`
  - Le composant interne fera ses propres queries (même logique d'agrégation que `ContributionsSubTab` lignes 380-467) — extraire cette agrégation dans un hook partagé `useMarcheurObservedSpecies` pour éviter la duplication.

**Données déjà disponibles** : `obs.source` (`inaturalist` / `ebird` / `gbif`), `obs.originalUrl`, `obs.kingdom`, `obs.scientificName`, `obs.date` — tout vient des snapshots biodiv déjà chargés.

**Sécurité** : edge function publique en lecture seule sur API iNat (open data), JWT vérifié uniquement pour rate-limiting basique. Aucune donnée sensible.

**Performance** : 1 seul appel iNat par marcheur par session (cache React Query `staleTime: 1h`). Si 0 observation iNat → pas d'appel.

## Hors périmètre

- Pas de stockage du handle iNat en BDD (tout résolu à la volée — peut être ajouté plus tard si trop d'appels).
- Pas de résolution eBird (API plus complexe, pas d'usage immédiat puisque suggestion).
- Pas de modification du système de scoring/Fréquence.
