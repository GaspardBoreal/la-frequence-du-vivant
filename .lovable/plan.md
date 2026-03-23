

# Corrections Mon Espace : lisibilite + inscription aux marches a venir

## Probleme 1 : Textes illisibles dans le widget progression

Le `ProgressionCard` utilise des couleurs claires de theme light (`bg-gray-100`, `text-gray-500`, `bg-emerald-50`, `text-muted-foreground`) sur le fond sombre emeraude de la page. Les textes et fonds sont quasi invisibles.

## Probleme 2 : Pas de moyen de s'inscrire aux marches a venir

Le marcheur voit "Aucune participation" avec un lien vers `/explorer`, mais aucune section ne lui montre directement les evenements a venir ni ne lui permet de s'y inscrire depuis son espace.

---

## Solution

### 1. Adapter `ProgressionCard` au theme sombre

**Fichier** : `src/components/community/ProgressionCard.tsx`

- Remplacer le fond `config.bgColor` (ex: `bg-gray-100`, `bg-emerald-50`) par `bg-white/10 backdrop-blur-sm`
- Remplacer la bordure `config.borderColor` par `border-white/20`
- Remplacer `text-muted-foreground` par `text-emerald-200/70`
- Remplacer les couleurs d'icones/textes `config.color` par des variantes claires adaptees au fond sombre
- Barre de progression : remplacer `bg-white/50` par `bg-white/20`
- Timeline des roles : remplacer `text-gray-300`, `bg-gray-100`, `border-gray-200` par des equivalents sombres (`text-emerald-200/30`, `bg-white/10`, `border-white/15`)
- Labels des roles : `text-emerald-100/80` au lieu du defaut sombre

### 2. Ajouter une section "Prochaines marches" avec inscription directe

**Fichier** : `src/pages/MarchesDuVivantMonEspace.tsx`

Ajouter une nouvelle section entre le QR Scanner CTA et "Mes marches" :

- Fetch des evenements a venir depuis `marche_events` (meme requete que Explorer : `date_marche >= today`, tri croissant, limit 3)
- Afficher des cartes compactes mobile-first pour chaque evenement :
  - Date formatee en francais + badge countdown ("Dans X jours")
  - Titre + lieu
  - Bouton "S'inscrire" qui insere une participation dans `marche_participations`
  - Si deja inscrit : afficher "Inscrit" avec check vert au lieu du bouton
- Design glassmorphism coherent avec la page (`bg-white/10 backdrop-blur-sm border border-white/20`)
- Etat vide elegant si aucun evenement a venir
- Verification des inscriptions existantes via les `participations` deja fetchees

Le bouton d'inscription execute un `supabase.from('marche_participations').insert({ user_id, marche_event_id })` avec toast de confirmation.

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/components/community/ProgressionCard.tsx` | Adapter les couleurs pour theme sombre |
| `src/pages/MarchesDuVivantMonEspace.tsx` | Ajouter section "Prochaines marches" avec inscription |

