# Parcours d'usage par marcheur

Objectif : voir, pour un marcheur et une période donnée, la trace exacte de ce qu'il a fait — marches et explorations consultées, fonctionnalités du jardin utilisées, échanges avec l'Assistant — pour préparer l'accueil, l'onboarding et des relances personnalisées.

## Ce qui existe aujourd'hui (vérifié)

- `marcheur_activity_logs` : 15 000 traces, 53 marcheurs, depuis avril 2026. Types réellement enregistrés : `session_start`, `tab_switch`, `page_view` (explorations), `feed_seen`, `feed_clicked`, `media_upload`, `tool_use`. C'est la colonne vertébrale.
- `event_public_views` : consultations anonymes des pages publiques d'événements (session, source, campagne) — pas de marcheur identifié.
- `search_logs` : recherches, déjà exploitées dans l'admin.
- Contributions réelles déjà datées : `marcheur_medias`, `marcheur_observations`, `marcheur_audio`, `marcheur_textes`, `marche_participations`, `quiz_responses`.
- **Rien** sur les jardins : aucun onglet de propriété n'est tracé.
- **Rien** sur l'Assistant : aucune question ni réponse n'est conservée en base.

## Phase 1 — La frise du marcheur

### Nouvel onglet « Parcours » dans /admin/community

- Sélection du marcheur (recherche par nom, ville, rôle) et de la période (7 j / 30 j / 90 j / dates libres).
- **Bandeau de tête** : dernière venue, nombre de sessions, temps de présence estimé, appareil dominant, univers le plus fréquenté.
- **Frise chronologique** groupée par jour, puis par session (rupture au-delà de 30 min d'inactivité) : chaque ligne porte une icône d'univers (Marches · Jardin · Assistant · Contribution), un libellé lisible en français et l'heure. Les identifiants techniques sont résolus en noms réels (nom de l'exploration, de l'événement, du jardin, de l'espèce).
- **Trois pistes parallèles** (vue « partition ») pour lire d'un coup d'œil où le marcheur passe son temps : Marches / Jardins / Assistant.
- **Carte de synthèse par univers** : top explorations, top onglets, contributions déposées, thèmes de questions.
- Export CSV de la période et lien partageable.

### Ce qu'on instrumente dès maintenant

- **Jardins** : chaque onglet et action clé d'un jardin envoie une trace (observations, analyse de sol, identification, palette, atelier, tour de jardin, clinique, capteurs, portrait/intention, carnet de terrain) avec le jardin concerné et l'action précise (consulté, créé, modifié, exporté, envoyé).
- **Marches** : on complète les traces manquantes (ouverture d'une fiche marche, d'un événement, d'une espèce, d'un média, déclenchement d'une collecte).
- **Assistant** : chaque échange est enregistré — question, réponse intégrale, surface d'origine (jardin, communauté, capteurs), contextes joints, durée, coût, erreur éventuelle.

### Cadre de confidentialité

Le contenu intégral des échanges est réservé aux administrateurs (accès refusé à tout autre rôle), consultable uniquement depuis cet onglet, avec mention explicite dans la page. Purge automatique proposée au-delà de 24 mois.

## Phase 2 — Analyses plus fines (à valider ensuite)

- Notion de session côté serveur (début, fin, durée réelle, appareil) plutôt qu'estimée à la lecture.
- Étapes nommées de parcours (découverte → première contribution → premier jardin → première question) et taux de franchissement.
- Détection automatique du thème des questions posées, pour croiser intérêts et fonctionnalités.
- Signaux d'accroche et de décrochage : fonctionnalité ouverte mais jamais utilisée, jardin créé sans observation, marcheur silencieux depuis X jours.
- Déclencheurs d'automatisation : à partir d'un signal, proposer un message d'accueil, un contenu ou une invitation ciblée — avec journal des relances envoyées.

## Détails techniques

**Base de données (une migration)**

- `assistant_conversations` (user_id, surface, propriete_id, exploration_id, marche_event_id, started_at) et `assistant_messages` (conversation_id, role, content, contexts jsonb, model, tokens, cost, latency_ms, error, created_at). RLS : lecture par l'auteur et par les administrateurs (`check_is_admin_user`), écriture par `service_role` depuis les fonctions edge. GRANT explicites (`authenticated`, `service_role`), aucun accès `anon`.
- Index sur `marcheur_activity_logs (user_id, created_at desc)` et `(event_type, created_at desc)`.
- RPC `get_marcheur_parcours(_user_id, _from, _to)` en SECURITY DEFINER, réservée aux admins : fusionne activités, contributions, participations, recherches et messages Assistant en une liste ordonnée avec libellés résolus (jointures explorations / marche_events / proprietes / espèces), plus les agrégats d'en-tête.

**Enregistrement des échanges** : écriture côté fonctions edge `propriete-chat`, `community-chat`/Dordonia et `iot` (client `service_role`), après la réponse, sans bloquer le flux.

**Traces jardin** : extension de `useActivityTracker` avec `proprieteId`, et un petit hook `useProprieteTracker` branché sur les onglets de `ProprieteEspace` et les actions clés, en `metadata` structurée (`{ module, action, cible }`).

**Front** : `src/hooks/admin/useMarcheurParcours.ts`, `src/components/admin/community/parcours/` (`ParcoursTab`, `MarcheurPicker`, `PeriodPicker`, `TimelineJour`, `TrackLanes`, `UniversSummary`, `AssistantThread`), branchés comme nouvel onglet dans la page communauté. Mobile first, densité maîtrisée, vocabulaire « Assistant ».
