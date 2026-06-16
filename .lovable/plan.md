# 🎯 Module Missions — ToDo prédictif pour les Bizdev

Un nouvel onglet **Missions** dans le CRM (`/admin/crm/missions`) pensé comme un copilote d'exécution commerciale : assignation multi-users, suivi de statut, planning, commentaires riches, et signaux prédictifs.

## 1. Architecture & navigation

- Nouvelle entrée sidebar CRM : **Missions** (icône `ListChecks`), entre *Opportunités* et *Marches*.
- Route : `/admin/crm/missions` (vue principale) + drawer plein écran pour le détail mission.
- Page composée de **3 vues commutables** (segmented control) :
  1. **Tableau** (Kanban À faire / En cours / Réalisée — réutilise les patterns de `KanbanBoard.tsx`)
  2. **Planning** (calendrier semaine/mois — `react-day-picker` + timeline custom)
  3. **Liste** (table dense filtrable, idéale pour les revues d'équipe)
- Header avec **filtres persistants** (URL params) : assigné·e, priorité, échéance, opportunité liée, entreprise, statut, tag.

## 2. Modèle de données (Supabase)

Nouvelles tables :

- `crm_missions` : id, titre, description (texte brut court), comments_rich (jsonb Tiptap), statut (`a_faire` | `en_cours` | `realisee` | `archivee`), priorité (`basse`|`normale`|`haute`|`critique`), due_at (timestamptz), start_at, completed_at, estimated_minutes, opportunity_id (FK), company_id (FK), contact_id (FK), marche_event_id (FK), created_by, created_at, updated_at, recurrence (jsonb, RRULE-light), tags text[], color, ai_score (numeric), ai_reason (text).
- `crm_mission_assignees` : mission_id, user_id, role (`owner`|`collab`|`watcher`), notified_at — permet **multi-assignation**.
- `crm_mission_comments` : id, mission_id, author_id, body_rich (jsonb Tiptap), created_at, edited_at — historique de discussion enrichie.
- `crm_mission_activity` : id, mission_id, actor_id, type (`status_change`|`assign`|`comment`|`due_change`|`ai_suggestion`), payload jsonb, created_at — fil chronologique.

RLS : lecture/écriture restreintes aux membres CRM (rôle `admin` ou `member` via `has_role`). GRANTs explicites `authenticated` + `service_role`. Trigger d'activity log automatique.

## 3. UX "Wahouhh" — détails inspirants

### a. Cartes mission vivantes

- Avatar(s) empilés des assignés (max 3 + “+N”).
- **Halo de couleur** selon priorité (vert/bleu/orange/rouge pulsant pour critique).
- Compte à rebours relatif ("dans 2 j", "en retard de 3 h" en rouge pulsé).
- Badge **lien contextuel** : entreprise/opportunité/marche cliquable (ouvre le drawer existant).
- Micro-progression : si sous-tâches, anneau circulaire de complétion.

### b. Kanban À faire → En cours → Réalisée

- Drag & drop (dnd-kit, déjà installé).
- Animation de confettis discrets quand on dépose dans *Réalisée* (`canvas-confetti`).
- Colonne *Réalisée* se replie automatiquement après 7 j pour garder la vue aérée.

### c. Planning

- Vue **semaine** (timeline horizontale, swimlanes par assigné) + vue **mois** (heatmap charge).
- Drag pour replanifier (update `due_at`).
- Bandeau "charge de la semaine" par bizdev avec jauge (vert/ambre/rouge) — détecte la surcharge.
- Stub d'export `.ics` + bouton "Synchroniser Google Agenda (bientôt)" désactivé pour préparer la phase 2.

### d. Drawer mission (détail)

- En-tête : titre éditable inline, statut, priorité, échéance, assignés (chips ajoutables).
- Section **Liens** : opportunité, entreprise, contact, marche — chacun avec preview au survol.
- **Éditeur riche Tiptap** pour description ET commentaires :
  - Gras / italique / souligné / barré
  - Couleur de texte + surlignage
  - Listes, citations, code, liens, mentions `@user` (notifient l'assigné)
  - Slash command `/` pour insérer checklist, séparateur, callout, fichier.
- **Fil d'activité** chronologique (qui a fait quoi, quand) à droite.
- Sous-tâches cochables (checklist) avec pourcentage live.

### e. Couche **prédictive / IA** (le “wahouhh” Bizdev)

- **Suggestions de missions automatiques** générées via edge function `crm-mission-suggester` (Lovable AI gateway) déclenchée :
  - quand une opportunité passe d'étape sans action sous 72 h → suggère "Relancer X par téléphone".
  - quand une marche approche (< 14 j) sans tâche de préparation → suggère "Envoyer fiche prépa".
  - quand un client devient inactif (90 j sans interaction) → suggère "Reprise de contact".
- **Score de priorité IA** (`ai_score` 0-100) calculé à partir de : taille deal, ancienneté sans action, signaux entreprise. Affiché en pastille gradient.
- **"Brief du matin"** : tuile en haut de l'accueil CRM listant les 3 missions du jour les plus impactantes pour l'utilisateur connecté + 1 suggestion IA à accepter en 1 clic.
- **Détection de doublons / collisions** : alerte si 2 missions visent même contact à 24 h près.
- **Auto-récap hebdo** envoyé chaque vendredi (edge function cron) : missions réalisées, en retard, top contributeur — format markdown stylé.

### f. Autres idées inspirantes

- **Pomodoro intégré** dans le drawer : bouton "Démarrer 25 min" qui passe la mission en *En cours* et lance un timer ambiant.
- **Templates de missions** (Plaquette, Relance D+7, Fiche prépa, Pack vivant) en 1 clic — réutilise `crmOpportunityActions.ts`.
- **Mode "Focus du jour"** plein écran : une seule mission à la fois, fond apaisant Forêt Émeraude / Papier Crème (respecte le thème), citation poétique en bas.
- **Streak & gamification douce** : badge "5 missions réalisées cette semaine", visible sur la fiche équipe — aligné avec l'esprit Fréquences (sans dénaturer le ton).
- **Raccourcis clavier** : `N` nouvelle mission, `/` recherche, `J/K` navigation, `E` édition, `Espace` toggle statut.
- **Notifications temps réel** via Supabase Realtime sur `crm_missions` + toast quand on est mentionné ou réassigné.

## 4. Périmètre de cette première itération (V1)

À livrer maintenant :

1. Tables Supabase + RLS + GRANTs + triggers d'activity.
2. Route + entrée sidebar + page Missions avec 3 vues (Kanban / Planning semaine / Liste).
3. Drawer détail avec Tiptap (gras/italique/souligné/couleurs) pour description + commentaires.
4. Assignation multi-users (picker basé sur `useTeamMembers`).
5. Filtres URL-persistants + recherche.
6. Tuile "Brief du matin" sur `/admin/crm` (3 missions prioritaires de l'utilisateur).
7. Confettis sur completion + raccourcis clavier de base (`N`, `Espace`).

À garder pour V2 (à valider ensuite) :

- Suggestions IA + score prédictif (edge function dédiée).
- Sync Google Agenda bidirectionnelle.
- Récap hebdo automatique.
- Pomodoro & mode Focus plein écran.
- Gamification / streaks.

## 5. Détails techniques

```text
src/
  pages/CrmMissions.tsx                 ← page principale (3 vues)
  components/crm/missions/
    MissionsKanban.tsx                  ← réutilise patterns KanbanBoard
    MissionsPlanning.tsx                ← timeline semaine + heatmap mois
    MissionsList.tsx                    ← table dense
    MissionCard.tsx                     ← carte mission (halo prio, avatars)
    MissionDrawer.tsx                   ← détail plein écran
    MissionRichEditor.tsx               ← wrapper Tiptap (B/I/U/color)
    MissionAssigneesPicker.tsx          ← multi-select team members
    MissionFilters.tsx                  ← barre filtres URL
    BriefDuMatinTile.tsx                ← tuile accueil CRM
  hooks/
    useCrmMissions.ts                   ← CRUD + Realtime
    useCrmMissionComments.ts
    useCrmMissionActivity.ts
  types/crmMissions.ts
```

Dépendances à ajouter : `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-color`, `@tiptap/extension-text-style`, `@tiptap/extension-underline`, `@tiptap/extension-highlight`, `@tiptap/extension-mention`, `canvas-confetti`, `date-fns` (déjà présent probablement).

Realtime activé sur `crm_missions`, `crm_mission_comments`, `crm_mission_activity` via `ALTER PUBLICATION supabase_realtime ADD TABLE …`.

## 6. Questions à valider avant build

1. **Périmètre V1 = OK ?** (livrer Kanban + Planning + Liste + Tiptap + Brief, garder IA/Google/gamification pour V2)
2. **Qui peut créer/voir les missions ?** Tous les membres CRM (rôles `admin` + `member`) 
3. **Liens contextuels obligatoires ?** Une mission peut être rattachée à une opportunité/entreprise, mais elle elle peut être aussi "libre"
4. **Notifications** : toast in-app suffisant pour V1