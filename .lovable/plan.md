# Tableau de bord "Profils d'usage marcheurs"

Un nouvel onglet **Usages** dans `/admin/community` (à côté de Profils / Rôles / Activités) qui transforme les logs bruts en une lecture inspirante et actionnable — pour l'animation, les ambassadeurs, le marketing automation, et le pitch mécènes.

## Données disponibles (audit)

- **`marcheur_activity_logs`** — 11 336 events / 38 users / 3 mois. Types : `tab_switch` (60 %), `session_start`, `page_view`, `media_upload`, `tool_use` + `metadata` jsonb (user_agent, viewport, target).
- **`marche_participations`** — participations validées (méthode + timestamp).
- **`community_profiles`** — genre, csp, âge, ville, rôle, statut, `types_marches_interets`, `recherche_prioritaire`, motivations, adhérent, superpouvoir sensoriel.
- **`marcheur_medias` / `marcheur_observations` / `marcheur_textes` / `marcheur_audio`** — contributions produites.
- **`search_logs`** — requêtes internes.
- **`engagement_analytics`** — popups planning/video, messages, réservations.
- **`adhesion_requests`** — conversion adhérent.

## Structure du dashboard (une page, 6 blocs)

### 1. Bandeau "Signal vital" (hero KPI, animé)
5 compteurs vivants avec spark-lines 30 j :
- Marcheur·euse·s actif·ve·s 7 j / 30 j / 90 j (DAU-WAU-MAU)
- Taux de ré-engagement (revient après 1re marche)
- Taux de conversion visite → participation → contribution → adhérent (funnel)
- Densité moyenne (events/user/semaine)
- "Fréquence collective" (index composite : sessions × contributions × diversité d'outils)

### 2. Segmentation RFM/Persona (le cœur)
Clustering automatique en **6 personas** calculés côté SQL (RPC dédiée) à partir de recency / frequency / contribution / diversity :
- **Sentinelles actives** — connexion récente + contributions + outils variés
- **Ambassadeurs latents** — inscrits engagés mais silencieux (pas de contribution 30 j)
- **Nouvelles graines** — inscrits < 30 j, exploration en cours
- **Contributeurs passifs** — participent mais ne créent pas de contenu
- **Explorateurs numériques** — usage app fort, participation terrain faible
- **Endormis** — 60 j+ sans activité (cible réactivation)

Affichage : **matrice bulle** (X = récence, Y = intensité, taille = contributions, couleur = persona), plus liste avec CTA "Exporter segment CSV" / "Créer campagne".

### 3. Parcours-type (Sankey / Flow)
Diagramme Sankey des trajectoires : `Inscription → 1re marche → Contribution → 2e marche → Adhésion`.
Met en évidence les points de fuite (ex. 40 % ne reviennent pas après la 1re marche → action ambassadeur).

### 4. Signature d'usage (Feature Adoption Radar)
Radar par persona des 8 fonctionnalités clés utilisées (Carnet, Carte, Espèces, Chatbot, Audio, Outils, Quiz, Partage) basé sur `event_target` + `tab_switch`. Montre où concentrer l'onboarding.

### 5. Rythmes de vie (Heatmap + saisonnalité)
- Heatmap 7 × 24 (jour × heure Paris) des connexions → meilleurs créneaux emailing.
- Barres saisonnalité 12 mois × type d'événement participé.
- Durée moyenne de session (calculée entre `session_start` et dernier event).

### 6. Territoires & profils sociologiques
- Carte de France (villes) + taille = # marcheurs actifs + tooltip persona majoritaire.
- Croisement CSP × âge × persona (heatmap).
- Top 5 "recherche prioritaire" par persona (mots-clés déclarés à l'inscription).

## Actions actionnables intégrées

Chaque bloc expose :
- **Export CSV** (segment / persona / cohorte).
- **Copier emails** (contact direct ambassadeur).
- **Générer prompt marketing** (bouton "Suggestion campagne IA" → ouvre le chatbot avec un brief pré-rempli : persona ciblé + angle + CTA).
- **Pitch mode** (bouton plein écran, typographie XXL, KPIs clés, sans UI admin → pour démo mécènes/clients).

## Architecture technique (concise)

- **RPC Postgres** `get_community_usage_dashboard(from date, to date)` retournant un JSON structuré (KPIs, personas, sankey_nodes, sankey_links, heatmap, radar). Toute la lourdeur en SQL (CTEs) — un seul aller-retour.
- **Hook** `useCommunityUsageDashboard(range)` avec React Query (staleTime 5 min).
- **Composant page** `AdminUsageDashboard.tsx` monté dans un nouvel onglet `Usages` dans `AdminCommunity` (à côté de Profils).
- **Sous-composants** dans `src/components/admin/community/usage/` :
  - `SignalVitalHero.tsx` (5 KPIs animés + sparkline recharts)
  - `PersonaMatrix.tsx` (scatter/bubble recharts + drawer par persona)
  - `JourneySankey.tsx` (recharts-sankey ou simple d3-sankey)
  - `FeatureRadar.tsx` (recharts RadarChart)
  - `RhythmHeatmap.tsx` (grille CSS custom + Framer Motion)
  - `TerritoryMap.tsx` (réutilise `RichMap` existant + agrégation par ville)
  - `PitchModeOverlay.tsx` (plein écran, réutilise la lib Framer déjà installée)
- **Utilitaire persona** `src/lib/marcheurPersonas.ts` — libellés, couleurs, seuils, descriptions FR.
- **Route** : conserve `/admin/community` avec nouvel onglet ; pas de nouvelle route.

## Ce qu'on livre dans cette itération

1. Migration : RPC `get_community_usage_dashboard` (SECURITY DEFINER, admin only via `has_role`).
2. Hook + types.
3. Page + 6 sous-composants.
4. Onglet "Usages" intégré dans l'admin communauté.
5. Bouton "Mode Pitch" (démo mécènes).
6. Exports CSV par persona.

## Ce qu'on ne fait PAS ici (itérations suivantes)

- Envoi effectif de campagnes emailing (mais on prépare l'export + prompt).
- Prédictions ML / churn score (on reste sur des seuils explicables).
- A/B test des CTA.
