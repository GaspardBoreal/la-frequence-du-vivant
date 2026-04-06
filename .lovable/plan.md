

## Enrichir les popups de la carte "Empreintes passées"

### Problème

Les popups Leaflet actuels sont basiques : texte brut sur fond blanc, pas de style cohérent avec l'identité visuelle, pas d'inspiration ni d'élégance.

### Design proposé

Popup personnalisée avec l'esthétique "Forêt Émeraude" du projet :

```text
┌────────────────────────────────────┐
│ ▌ bande colorée gauche (type)     │
│                                    │
│  🌱 MARCHE AGROÉCOLOGIQUE          │  ← badge type, couleur du type
│                                    │
│  La transhumance de Mouton Village │  ← titre, font-crimson, bold
│                                    │
│  📅 29 mars 2026                   │  ← date formatée
│  📍 NOUAILLE-MAUPERTUIS            │  ← lieu
│                                    │
│  👥 2 marcheurs ont exploré        │  ← social proof, italic
│       ce sentier                   │
└────────────────────────────────────┘
```

### Caractéristiques visuelles

- **Fond** : dégradé léger crème → blanc (`bg-gradient-to-br from-stone-50 to-white`)
- **Bande latérale gauche** : 3px de la couleur du type d'événement (emerald/violet/amber)
- **Badge type** : identique au Carnet Vivant avec icône et label, arrondi, compact
- **Titre** : `font-crimson text-sm font-bold text-stone-800` — élégant et lisible
- **Date + lieu** : icônes inline `Calendar` et `MapPin`, `text-xs text-stone-500`
- **Social proof** : compteur participants en italique, ton chaleureux ("X marcheurs ont exploré ce sentier")
- **Override CSS Leaflet** : supprimer le style par défaut des popups (ombre, bordure, flèche) via classes CSS personnalisées pour un rendu épuré
- **Min-width** : `200px`, max-width `260px` — responsive naturellement

### Modifications

**`src/components/community/tabs/MarchesTab.tsx`** :
1. Passer `pastParticipantCounts` en prop au composant `PastEventsMap`
2. Remplacer le contenu `<Popup>` par le nouveau design riche
3. Ajouter une classe CSS custom sur le popup Leaflet pour neutraliser les styles par défaut (`.leaflet-popup-content-wrapper` override)
4. Ajouter les icônes `Calendar`, `MapPin`, `Users` dans les imports

### Fichier impacté

| Action | Fichier |
|--------|---------|
| Modifier | `src/components/community/tabs/MarchesTab.tsx` |

