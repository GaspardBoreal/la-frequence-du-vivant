

## Transformer le bandeau profil en éditeur complet et élégant

### Problème

Le panneau "Mon profil" est en lecture seule et n'affiche que 3 champs (nom, email, ville). Les champs suivants sont absents et non modifiables :
- Téléphone
- Date de naissance
- Motivation
- Kigo d'accueil (relation au vivant)
- Superpouvoir sensoriel
- Niveau d'intimité avec la nature

### Solution

Refondre `MonEspaceSettings` en un panneau profil interactif avec un mode consultation et un mode édition, dans un design glassmorphism cohérent avec l'univers existant.

### UX/UI Design

**Mode consultation (par défaut)** : tous les champs affichés en lecture seule dans des cartes glassmorphism, regroupés par sections thématiques :
1. **Identité** — Avatar + initiales, prénom, nom, email (non modifiable), ville, téléphone, date de naissance
2. **Votre relation au vivant** — Kigo d'accueil, superpouvoir sensoriel, niveau d'intimité, motivation

Un bouton "Modifier mon profil" bascule en mode édition.

**Mode édition** : les champs deviennent des inputs stylisés (fond `white/10`, bordure `white/20`, texte blanc). Les champs sensoriels (kigo, superpouvoir, intimité) utilisent des sélecteurs visuels avec les mêmes emojis que l'inscription. Boutons "Enregistrer" et "Annuler" en bas.

**Scrollable** : le `SheetContent` passe en `overflow-y-auto` pour supporter tous les champs sur mobile.

### Modifications techniques

**Fichier `src/components/community/MonEspaceSettings.tsx`**
- Ajouter un state `editing` (booléen) et un state `formData` (copie locale du profil)
- Ajouter les champs manquants : téléphone, date de naissance, motivation, kigo, superpouvoir, intimité
- Regrouper les champs en 2 sections avec des séparateurs visuels
- En mode édition : inputs avec `onChange` → `setFormData`
- Au clic "Enregistrer" : appel `supabase.from('community_profiles').update(...)` puis `refreshProfile()`
- Icônes par champ : Phone, Calendar, Heart, Sparkles, Mountain, MessageSquare

**Fichier `src/components/community/MonEspaceHeader.tsx`**
- Passer le `profile` complet et `refreshProfile` comme props au lieu de champs individuels

**Fichier `src/pages/MarchesDuVivantMonEspace.tsx`**
- Passer `profile` et `refreshProfile` au header

### Props mises à jour

```text
MonEspaceSettingsProps {
  open, onOpenChange
  profile: CommunityProfile   // objet complet
  email: string
  role: CommunityRoleKey
  onSignOut: () => void
  onProfileUpdated: () => void // appelle refreshProfile
}
```

### Champs éditables et leurs contrôles

| Champ | Type de contrôle |
|-------|-----------------|
| Prénom | Input texte |
| Nom | Input texte |
| Ville | Input texte |
| Téléphone | Input tel |
| Date de naissance | Input date |
| Motivation | Textarea |
| Kigo d'accueil | Select (🦋 Curieux·se / 🌿 Habitué·e / 🌳 Profond·e) |
| Superpouvoir sensoriel | Select (👁️ Vue / 👂 Ouïe / 👃 Odorat / ✋ Toucher / 👅 Goût) |
| Niveau d'intimité | Select (🥾 Randonneur / 🏕️ Bivouaqueur / 🌲 Forestier) |

### Fichiers impactés

| Action | Fichier |
|--------|---------|
| Refonte | `src/components/community/MonEspaceSettings.tsx` |
| Modifier | `src/components/community/MonEspaceHeader.tsx` |
| Modifier | `src/pages/MarchesDuVivantMonEspace.tsx` |

