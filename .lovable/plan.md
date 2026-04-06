

## Problème identifié

La table `marcheur_activity_logs` est **vide**. Le hook `useActivityTracker` existe et fonctionne, mais il n'est branché que dans 2 composants :
- `ExplorationMarcheurPage` (quand on ouvre une exploration)
- `ApprendreTab` (sous-onglets)

Il manque le tracking sur :
1. **La connexion** (session_start)
2. **La page Mon Espace** (`/marches-du-vivant/mon-espace`) — page d'accueil des marcheurs
3. **Les onglets de Mon Espace** (Accueil, Marches, Carnet, Outils)
4. **Les outils** (Zones, Quiz, Sons, Kigo)
5. **Les uploads de médias** (photos, sons, textes)
6. **L'ouverture d'une marche** (MarcheDetailModal)

## Plan d'instrumentation complète

### 1. Tracker la connexion — `MarchesDuVivantMonEspace.tsx`

Ajouter un `useEffect` au montage qui log `session_start` dès que `user` est disponible. Aussi tracker les changements d'onglets Mon Espace (Accueil, Marches, Carnet, Outils).

### 2. Tracker les onglets Mon Espace — `MarchesDuVivantMonEspace.tsx`

Quand `activeTab` change, appeler `trackActivity('tab_switch', 'tab:mon-espace:${activeTab}')`.

### 3. Tracker l'ouverture d'une marche — `MarcheDetailModal.tsx`

Quand le modal s'ouvre, log `marche_view` avec le `marche_event_id`.

### 4. Tracker les uploads de médias

Dans les composants d'upload (photo, audio, texte), ajouter un appel après un upload réussi : `trackActivity('media_upload', 'photo'|'audio'|'text')`.

### 5. Tracker les outils

Dans `OutilsTab` ou les composants d'outils individuels, tracker `tool_use` + nom de l'outil.

### 6. Corriger le debounce trop agressif dans `useActivityTracker`

Le debounce actuel empêche de logger deux événements différents successifs car `clearTimeout` annule le précédent. Si on clique sur l'onglet "Marches" puis "Empreinte" en moins de 2s, seul "Empreinte" est loggé. Correction : ne pas annuler le timer précédent si la clé est différente.

### Fichiers impactés

| Action | Fichier |
|--------|---------|
| Modifier | `src/hooks/useActivityTracker.ts` (fix debounce) |
| Modifier | `src/pages/MarchesDuVivantMonEspace.tsx` (session_start + onglets) |
| Modifier | `src/components/community/MarcheDetailModal.tsx` (marche_view) |
| Modifier | `src/components/community/tabs/OutilsTab.tsx` (tool_use) |
| Identifier & modifier | Composants d'upload média (media_upload) |

### Résultat attendu

Dès qu'un marcheur se connecte et navigue dans Mon Espace, chaque action significative est enregistrée. Le dashboard `/admin/community` affichera immédiatement les sessions, onglets favoris, et activités.

