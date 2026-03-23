

# Texte dynamique selon les inscriptions dans ProgressionCard

## Probleme

Le texte descriptif sous le role est statique (`config.description`). Quand un marcheur s'inscrit a une marche mais n'a pas encore de participation validee, il voit toujours "Inscrivez-vous a votre premiere marche pour devenir Marcheur" — ce qui est decourageant.

## Solution

Passer le nombre d'inscriptions en cours (non validees) au `ProgressionCard` et afficher un texte contextuel different quand le marcheur a des inscriptions.

### 1. `src/components/community/ProgressionCard.tsx`

Ajouter une prop optionnelle `pendingCount?: number` (nombre d'inscriptions non encore validees).

Dans le rendu, remplacer le `config.description` statique par une logique contextuelle :

- **Role `marcheur_en_devenir`** :
  - Si `pendingCount > 0` et `pendingCount === 1` : *"Bravo, votre premiere marche vous attend ! Chaque pas compte — explorez d'autres sentiers pour enrichir votre parcours."*
  - Si `pendingCount > 1` : *"Magnifique, {pendingCount} marches vous attendent ! Vous etes deja sur le chemin du Vivant."*
  - Si `pendingCount === 0` : texte actuel (config.description)
- **Autres roles** : logique similaire adaptee au seuil suivant, ou texte par defaut si aucune inscription en attente

### 2. `src/pages/MarchesDuVivantMonEspace.tsx`

Calculer `pendingCount` = nombre de participations sans `validated_at` et le passer au composant :

```tsx
const pendingCount = participations.filter(p => !p.validated_at).length;

<ProgressionCard
  role={role}
  marchesCount={profile.marches_count}
  pendingCount={pendingCount}
  formationValidee={...}
  certificationValidee={...}
/>
```

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/components/community/ProgressionCard.tsx` | Ajouter prop `pendingCount`, texte contextuel |
| `src/pages/MarchesDuVivantMonEspace.tsx` | Calculer et passer `pendingCount` |

