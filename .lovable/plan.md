## Objectif

Enrichir les fiches marcheurs avec des données de qualification (CSP, tranche d'âge dérivée, genre), permettre leur édition côté admin et côté marcheur, et créer un onglet **Profils** « wahou » qui démontre l'impact sociétal des Marches du Vivant.

Principe directeur : **détail privé (admin uniquement), agrégats anonymisés publics**.

---

## 1. Schéma de données (migration SQL)

Ajouts à `community_profiles` :

- `genre` — enum `profile_gender` : `femme`, `homme`, `non_binaire`, `prefere_ne_pas_dire` (nullable)
- `csp` — enum `profile_csp` aligné INSEE PCS-2020 niveau 1 :
  - `agriculteurs` (Agriculteurs exploitants)
  - `artisans_commercants` (Artisans, commerçants, chefs d'entreprise)
  - `cadres` (Cadres et professions intellectuelles supérieures)
  - `professions_intermediaires`
  - `employes`
  - `ouvriers`
  - `retraites`
  - `etudiants` (Élèves, étudiants)
  - `sans_activite` (Autres personnes sans activité professionnelle)
  - `prefere_ne_pas_dire`
- `csp_precision` — text nullable (champ libre court : « ingénieur agronome », « libraire »…)

Tranche d'âge **calculée** depuis `date_naissance` (déjà présent) → pas de stockage redondant. Une fonction SQL helper `public.age_bracket(date)` renvoie l'une des 6 tranches demandées.

RLS : politiques existantes conservées. `genre` et `csp` ne sont jamais exposés bruts via RPC publique. Les vues publiques (`/lecteurs/`) n'affichent rien de neuf.

RPC agrégats (SECURITY DEFINER) `get_community_impact_aggregates()` renvoyant :
- répartition par tranche d'âge (count par bucket)
- répartition par genre
- répartition par CSP
- croisements CSP × tranche d'âge
- répartition par rôle communautaire
- nombre de territoires (explorations) touchés

Aucune ligne nominative renvoyée — uniquement des comptages avec seuil minimal de 3 par cellule (k-anonymat léger).

---

## 2. Onglets admin `/admin/community`

### 2.a Édition d'une fiche marcheur (transverse à tous les onglets)

- Bouton « Éditer » sur chaque ligne (onglet Inscriptions + futur onglet Profils) ouvre un **Sheet latéral** `MarcheurEditSheet`.
- Champs éditables : prénom, nom, ville, téléphone, date de naissance, motivation, kigo_accueil, superpouvoir_sensoriel, niveau_intimite_vivant, avatar_url, **genre**, **csp**, **csp_precision**, rôle (admin only), formation_validée, certification_validée.
- Hors scope : email (auth), mot de passe.
- Validation Zod côté client. Mutation via `supabase.from('community_profiles').update()` puis invalidation des queries.

### 2.b Nouvel onglet « Profils »

Layout en deux étages :

```text
┌──────────────────────────────────────────────────────────┐
│  BANDEAU IMPACT (dataviz animées)                        │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────┐ │
│  │ Pyramide   │ │ Donut      │ │ Treemap    │ │ Carte  │ │
│  │ des âges   │ │ Genres     │ │ CSP        │ │ Terr.  │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────┘ │
│  + compteurs animés : N marcheurs · M territoires · …    │
├──────────────────────────────────────────────────────────┤
│  MOSAÏQUE VIVANTE (cartes-portraits filtrables)          │
│  Filtres : tranche d'âge · genre · CSP · rôle · territ.  │
│  Recherche texte                                         │
│  Tri : récents · alphabétique · plus actifs              │
│  Cartes : avatar · nom · rôle · âge · CSP · ville ·      │
│           kigo · superpouvoir · CTA Éditer               │
│  Pagination ou scroll infini                             │
└──────────────────────────────────────────────────────────┘
```

Composants :
- `ProfilsImpactDashboard.tsx` — bandeau dataviz (Recharts déjà utilisé).
- `ProfilsMosaique.tsx` — grille de `ProfilCard.tsx`.
- `ProfilCard.tsx` — carte glassmorphism, palette du thème actif (Papier Crème / Forêt Émeraude), hover révèle motivation + bouton Éditer.
- Réutilise `MarcheurEditSheet` pour l'édition.

Style : respect strict des thèmes existants, animations sobres (framer-motion déjà présent), pas de banderole pédagogique (sobriété informationnelle).

Export CSV (admin) optionnel — colonnes : prénom, nom, ville, tranche d'âge, genre, CSP, rôle, marches_count, créé le.

---

## 3. Édition côté marcheur — `/marches-du-vivant/mon-espace`

Dans la section **Édition Profil** existante (`MonEspaceSettings.tsx` / hub glassmorphism), ajouter une sous-section **« Mieux vous connaître »** :

- Champ Date de naissance (déjà présent ? — sinon ajout)
- Sélecteur Genre (4 options + « préfère ne pas dire »)
- Sélecteur CSP (10 entrées INSEE)
- Précision libre (placeholder : « ex. maraîcher bio »)
- Bandeau d'explication courte : « Ces informations restent privées. Seules des statistiques anonymisées contribuent à démontrer l'impact collectif des Marches du Vivant. »
- Lien vers une page « Pourquoi ces questions ? » (future, non bloquante).

Validation Zod identique au backoffice.

---

## 4. Fichiers à créer / modifier

**Migration SQL**
- `supabase/migrations/<ts>_community_profiles_qualification.sql` — enums, colonnes, fonction `age_bracket`, RPC `get_community_impact_aggregates`.

**Référentiel partagé**
- `src/lib/communityProfileTaxonomy.ts` — listes Genre, CSP, Tranches d'âge + helpers `computeAgeBracket(date)`, labels FR.

**Admin**
- `src/components/admin/community/MarcheurEditSheet.tsx` (nouveau)
- `src/components/admin/community/ProfilsImpactDashboard.tsx` (nouveau)
- `src/components/admin/community/ProfilsMosaique.tsx` (nouveau)
- `src/components/admin/community/ProfilCard.tsx` (nouveau)
- `src/pages/CommunityProfilesAdmin.tsx` — ajouter onglet « Profils », brancher Sheet d'édition sur l'onglet Inscriptions.
- `src/hooks/useCommunityImpactAggregates.ts` (nouveau, appelle la RPC)

**Mon Espace**
- `src/components/community/MonEspaceSettings.tsx` — section « Mieux vous connaître ».

**Types**
- `src/integrations/supabase/types.ts` est régénéré automatiquement par la migration.

---

## 5. Sécurité & confidentialité

- Genre / CSP traités comme PII : jamais renvoyés par les RPC publiques.
- `get_community_impact_aggregates` SECURITY DEFINER, accessible authentifié + service role. Une variante publique `get_community_impact_public` peut renvoyer uniquement des pourcentages globaux (pas de cellules < 3) si on souhaite l'afficher hors admin (hors scope immédiat — à confirmer plus tard).
- L'admin reste seul à voir le détail nominatif (RLS existante sur `community_profiles`).
- `csp_precision` text borné à 80 caractères, `trim` + Zod.

---

## 6. Hors scope (à expliciter)

- Pages publiques d'impact (rapport annuel grand public) : non incluses, mais la RPC d'agrégats les rendra possibles ensuite.
- Migration des marcheurs déjà inscrits : champs nullables, pas de back-fill. Un encart « Complétez votre profil » apparaîtra dans Mon Espace tant que genre + CSP ne sont pas renseignés.
- Email / mot de passe : non éditables depuis le Sheet admin (gérés par Supabase Auth).
