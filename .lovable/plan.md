

# Plan general : Systeme communautaire des Marcheurs du Vivant

## Vue d'ensemble

Creer un systeme complet d'authentification communautaire avec inscription creative, progression par roles, et validation par QR code. Separe de l'authentification admin existante.

## Phase 1 — Migration SQL (3 tables + enum + trigger)

### Table `community_profiles`
- `user_id` uuid FK auth.users, `prenom`, `nom`, `ville`, `telephone`, `date_naissance`, `motivation`, `avatar_url`
- `role` enum (`marcheur_en_devenir`, `marcheur`, `eclaireur`, `ambassadeur`, `sentinelle`)
- `marches_count` integer, `formation_validee` boolean, `certification_validee` boolean
- **Champs creatifs** : `kigo_accueil` (dropdown : "Je parle deja aux arbres", "En transition depuis le beton", "Curieux du vivant", "Expert en canape"), `superpouvoir_sensoriel` (Vue, Ouie, Odorat, "Sixieme sens pour la pluie"), `niveau_intimite_vivant` ("Un cactus compte ?", "Randonneur du dimanche", "Naturaliste assume", "Druide certifie")
- Trigger `on INSERT auth.users` → auto-cree le profil avec role `marcheur_en_devenir`

### Table `marche_events`
- `title`, `description`, `date_marche`, `lieu`, `latitude`, `longitude`, `qr_code` (unique, auto-genere), `max_participants`, `exploration_id` (optionnel), `created_by`

### Table `marche_participations`
- `user_id`, `marche_event_id`, `validated_at`, `validation_method` (`qr_code` | `admin`)
- UNIQUE(user_id, marche_event_id)

### Trigger de progression automatique
Apres validation d'une participation :
- 1+ marches → `marcheur`
- 5+ marches → `eclaireur`
- 10+ marches ET `formation_validee` → `ambassadeur`
- 20+ marches ET `certification_validee` → `sentinelle`

### RLS
- `community_profiles` : lecture/modif propre profil, admins voient tout
- `marche_events` : lecture publique, ecriture admin
- `marche_participations` : lecture propre, admins voient tout

## Phase 2 — Page connexion `/marches-du-vivant/connexion`

### Fichiers
- `src/pages/MarchesDuVivantConnexion.tsx`
- `src/hooks/useCommunityAuth.ts`

### Formulaire d'inscription (design emeraude immersif)
- Onglets Connexion / Inscription
- **Champs classiques** : email, mot de passe, prenom, nom, ville, telephone, date de naissance, motivation, photo
- **Champs creatifs** (avec dose d'humour) :
  - "Votre relation actuelle avec le vivant ?" → dropdown Kigo d'accueil
  - "Votre superpouvoir sensoriel ?" → choix illustre
  - "Votre niveau d'intimite avec la nature ?" → echelle poetique
  - **Engagement poetique** (remplace les CGU) : "Je promets de lever les yeux de mon ecran au moins une fois pendant la marche"
- Page `/marches-du-vivant/reset-password` pour reinitialisation mot de passe

## Phase 3 — Espace personnel `/marches-du-vivant/mon-espace`

### Fichiers
- `src/pages/MarchesDuVivantMonEspace.tsx`
- `src/hooks/useCommunityProfile.ts`
- `src/components/community/ProgressionCard.tsx`
- `src/components/community/RoleBadge.tsx`

### Contenu
- Carte de role actuel avec badge visuel (Footprints/Eye/Heart/Shield + couleur emerald/teal/sky/amber)
- Barre de progression vers le prochain role avec seuils affiches
- Historique des marches validees
- Profil editable (y compris champs creatifs)
- Bouton "Scanner un QR code"

## Phase 4 — Systeme QR code

### Fichiers
- `src/pages/MarchesDuVivantValiderPresence.tsx`
- `src/components/community/QRCodeScanner.tsx`

### Fonctionnement
- Admin cree un evenement → QR code unique genere (affichable/imprimable)
- Marcheur scanne le QR → URL `/marches-du-vivant/valider-presence/:qrCode`
- Si connecte → validation automatique + toast de felicitation
- Si non connecte → redirection connexion puis retour validation
- Le trigger SQL met a jour automatiquement le role

## Phase 5 — Integration header + CTA

### Modifications
- **Header global** (`src/App.tsx` ou composant header) : bouton "Connexion / Mon espace" visible partout
- **Pages Marches du Vivant** : CTA "Rejoindre la communaute" dans `MarchesDuVivantAssociation.tsx` et `MarchesDuVivantExplorer.tsx`

## Phase 6 — Admin evenements de marche

### Modifications
- Nouvelle section admin pour creer/gerer les evenements de marche
- Generation et impression du QR code par evenement
- Vue des participants inscrits/valides
- Boutons pour valider manuellement `formation_validee` et `certification_validee` sur un profil

## Routes a ajouter dans App.tsx

```text
/marches-du-vivant/connexion        → MarchesDuVivantConnexion
/marches-du-vivant/mon-espace       → MarchesDuVivantMonEspace (protegee)
/marches-du-vivant/valider-presence/:qrCode → MarchesDuVivantValiderPresence
/marches-du-vivant/reset-password   → ResetPassword communautaire
```

## Fichiers a creer/modifier

| Fichier | Action |
|---------|--------|
| Migration SQL | Creer (enum + 3 tables + trigger profil + trigger progression + RLS) |
| `src/pages/MarchesDuVivantConnexion.tsx` | Creer |
| `src/pages/MarchesDuVivantMonEspace.tsx` | Creer |
| `src/pages/MarchesDuVivantValiderPresence.tsx` | Creer |
| `src/hooks/useCommunityAuth.ts` | Creer |
| `src/hooks/useCommunityProfile.ts` | Creer |
| `src/components/community/ProgressionCard.tsx` | Creer |
| `src/components/community/RoleBadge.tsx` | Creer |
| `src/components/community/QRCodeScanner.tsx` | Creer |
| `src/App.tsx` | Modifier (routes) |
| `src/pages/MarchesDuVivantAssociation.tsx` | Modifier (CTA) |
| `src/pages/MarchesDuVivantExplorer.tsx` | Modifier (CTA) |

## Ordre d'implementation suggere

1. Migration SQL
2. Page connexion + hook auth communautaire
3. Page "Mon espace" + composants progression
4. Systeme QR code
5. Integration header + CTA
6. Admin evenements

