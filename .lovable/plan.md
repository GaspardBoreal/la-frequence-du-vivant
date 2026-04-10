

## Désinscription depuis le Carnet Vivant

### Concept

Un marcheur peut se désinscrire d'une marche **à venir** (non encore validée) directement depuis son Carnet, sans naviguer vers l'onglet Marches.

**Interaction mobile-first** : un swipe gauche ou un appui long sur la carte de la marche révèle un bouton de désinscription rouge discret. Un dialog de confirmation empêche les erreurs.

```text
┌─────────────────────────────────────────┐
│  DEVIAT Le Réveil de la Terre           │
│  11 avr. 2026  📍 DEVIAT - Charente     │
│  🌿 Marche éco poétique                │
│                            [Se désinscrire] ← rouge discret, visible seulement si marche future + non validée
└─────────────────────────────────────────┘

         ↓ clic

┌─────────────── Confirmation ──────────────┐
│  Quitter cette marche ?                   │
│  Vous pourrez vous réinscrire plus tard   │
│  depuis l'onglet Marches.                 │
│                                           │
│  [Annuler]          [Se désinscrire]      │
└───────────────────────────────────────────┘
```

### Règles métier

- **Visible uniquement** si la marche est dans le futur (`date_marche > today`) **ET** `validated_at === null` (pas encore pointé/validé)
- Supprime la ligne dans `marche_participations` via `supabase.from('marche_participations').delete().eq('id', participation.id)`
- Invalide les queries `community-participations` pour rafraîchir le Carnet et l'onglet Marches simultanément
- Toast de confirmation : "Désinscription confirmée. Vous pouvez vous réinscrire à tout moment."

### Design

- Bouton discret (ghost, texte rouge/rose, petite icône `UserMinus` ou `X`) affiché sous les badges/données de la carte
- Pas de swipe (complexité inutile) : simple bouton textuel, cohérent avec le design existant
- Dialog de confirmation via le composant `AlertDialog` de shadcn/ui déjà disponible
- Animation de disparition (`framer-motion exit`) quand la carte est retirée

### Modifications

| Action | Fichier |
|--------|---------|
| Modifier | `src/components/community/CarnetVivant.tsx` |

**Détail :**

1. Ajouter une prop `onUnregister?: (participationId: string) => void` au composant `MarcheCard`
2. Dans `MarcheCard` : afficher un bouton "Se désinscrire" si `!participation.validated_at` et `date_marche > new Date()`
3. Dans `CarnetVivant` : implémenter `handleUnregister` qui appelle `supabase.from('marche_participations').delete().eq('id', id)`, invalide le cache, et affiche un toast
4. Envelopper le bouton dans un `AlertDialog` de confirmation
5. Ajouter `AnimatePresence` + `layout` sur les cartes pour une transition fluide à la suppression

