

# Refonte inspirante de l'onglet "Marches"

## Constat

L'onglet Marches est une liste plate et utilitaire : des cartes identiques avec titre + date + lieu + bouton "S'inscrire". Aucune narration, aucun contexte sur ce que le marcheur va découvrir, rien qui donne envie. Le bloc QR "Valider une participation" occupe la première place alors qu'il ne concerne que le jour J.

## Vision

Transformer cet onglet en un **carnet d'aventures à venir** qui raconte une histoire, éduque et motive.

## Propositions

### 1. Cartes enrichies avec teaser thématique

Chaque `marche_event` a un champ `description` et un `exploration_id` (lien vers une exploration). Actuellement ces données ne sont pas affichées. On les exploite :

- **Description** : afficher 2 lignes du descriptif sous le titre (line-clamp-2) pour donner envie
- **Exploration associée** : récupérer le nom de l'exploration liée et l'afficher comme tag thématique (ex: "🌍 Dordogne — Paysages sonores")
- **Piliers** : ajouter des micro-icones colorées indiquant les piliers abordés (🎵 Bioacoustique, 🌿 Biodiversité, ✍️ Géopoétique) — hardcodées par mots-clés dans le titre/description

### 2. Section "Ce que vous allez découvrir" par marche

Pour les marches non encore inscrites, ajouter sous la description 2-3 micro-tags éducatifs tirés de mots-clés du titre/description :
- "Écoute des sols", "Mesure du vivant", "Poésie du territoire"...
Cela transforme le CTA d'inscription en promesse d'apprentissage.

### 3. Réorganiser la hiérarchie visuelle

```text
┌─────────────────────────────────────┐
│ ✨ Votre prochaine aventure         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Le Réveil de la Terre    3 sem. │ │
│ │ Marcher sur un sol qui respire  │ │
│ │ 11 avr · DEVIAT · 🌍 Charente  │ │
│ │ 🌿 Biodiversité  🎵 Écoute     │ │
│ │         ✅ Inscrit               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ La Transhumance       Demain    │ │
│ │ Suivre les pas des bergers...   │ │
│ │ 28 mars · Vouillé → Mouton V.  │ │
│ │ 🌿 Biodiversité  ✍️ Récit      │ │
│ │      [ S'inscrire → ]           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📱 Jour J ? Scanner le QR code →   │
│                                     │
│ 📜 Historique (1 participation)     │
│ └ Le Réveil... · 11 avr · Validée  │
└─────────────────────────────────────┘
```

**Changements clés** :
- Le QR "Valider" descend en bas (action jour J, pas quotidienne) — rendu plus compact sur une ligne
- Le titre de section passe de "Prochaines marches" à "Votre prochaine aventure" (personnel, engageant)
- Les cartes inscrites restent en haut mais avec une bordure dorée subtile

### 4. Message motivant contextuel si toutes les marches sont inscrites

Si le marcheur est inscrit à toutes les marches à venir, afficher un message de type :
> "Vous êtes prêt pour l'aventure ! Chaque marche est une exploration unique du vivant."

## Modifications techniques

**Fichiers modifiés** :

| Fichier | Changement |
|---------|-----------|
| `src/pages/MarchesDuVivantMonEspace.tsx` | Enrichir la query pour inclure `exploration_id, explorations(name)` en plus des champs actuels |
| `src/components/community/tabs/MarchesTab.tsx` | Refonte complète : description visible, tags piliers, QR déplacé en bas, titre de section personnalisé, message motivant |

**Données** : tout vient de champs existants (`description`, `exploration_id` → `explorations.name`). Pas de nouvelle table ni migration.

