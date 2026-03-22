

# Phase 5 & 6 : CTA communautaires + Admin evenements de marche

## Phase 5 — CTA dans les pages existantes

### `src/pages/MarchesDuVivantAssociation.tsx`
- Remplacer le CTA final (lignes 380-407) : au lieu de pointer vers gaspardboreal.com/contact, ajouter deux boutons :
  - **"Creer mon compte"** → lien vers `/marches-du-vivant/connexion` (bouton principal emeraude)
  - **"J'ai deja un compte"** → lien vers `/marches-du-vivant/connexion` (bouton outline)
- Mettre a jour le texte : "Rejoignez la communaute des Marcheurs du Vivant" au lieu de "Contactez-nous"

### `src/pages/MarchesDuVivantExplorer.tsx`
- Ajouter un bandeau CTA apres la section detecteur / avant le footer (vers ligne 860) :
  - "Devenez Marcheur du Vivant" avec lien vers `/marches-du-vivant/connexion`
  - Style coherent emeraude

## Phase 6 — Admin evenements de marche

### Nouvelle page `src/pages/MarcheEventsAdmin.tsx`
- Liste des evenements de marche depuis `marche_events`
- Formulaire de creation : titre, description, date, lieu, lat/lng, max_participants, exploration_id (optionnel)
- QR code unique genere automatiquement (utiliser `qrcode.react` pour l'affichage)
- Pour chaque evenement : voir les participants inscrits/valides, bouton imprimer le QR
- Boutons pour valider manuellement `formation_validee` et `certification_validee` sur les profils communautaires

### Nouvelle page `src/pages/CommunityProfilesAdmin.tsx`
- Vue admin de tous les `community_profiles` avec role, marches_count
- Actions : valider formation, valider certification, voir profil complet

### Modifications existantes

**`src/pages/AdminAccess.tsx`** (ligne 148, avant la fermeture du grid)
- Ajouter une carte "Evenements & Communaute" avec lien vers `/admin/marche-events` et `/admin/community`

**`src/App.tsx`**
- Ajouter les routes protegees :
  - `/admin/marche-events` → `MarcheEventsAdmin`
  - `/admin/community` → `CommunityProfilesAdmin`

### Dependance npm
- `qrcode.react` pour generer les QR codes visuels des evenements

## RLS complementaire
- `marche_events` : la policy INSERT/UPDATE/DELETE doit verifier `check_is_admin_user(auth.uid())` — actuellement seul SELECT est public, les ecritures n'ont pas de policy → ajouter via migration

## Fichiers

| Fichier | Action |
|---------|--------|
| `src/pages/MarcheEventsAdmin.tsx` | Creer |
| `src/pages/CommunityProfilesAdmin.tsx` | Creer |
| `src/pages/MarchesDuVivantAssociation.tsx` | Modifier (CTA) |
| `src/pages/MarchesDuVivantExplorer.tsx` | Modifier (CTA) |
| `src/pages/AdminAccess.tsx` | Modifier (carte admin) |
| `src/App.tsx` | Modifier (2 routes) |
| Migration SQL | RLS write policies sur `marche_events` |

