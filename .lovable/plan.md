

# Connecter le Vivant aux vraies donnees et distinguer 3 regards

## Diagnostic

Le probleme est double :

1. **Bug technique** : `VivantTab` cherche les `biodiversity_snapshots` par proximite lat/lng de l'evenement, mais les snapshots sont indexes par `marche_id`. Resultat : aucune donnee ne remonte.

2. **Manque conceptuel** : le marcheur ne peut pas distinguer les donnees de la plateforme (iNaturalist/eBird), les contributions des autres marcheurs, et les siennes.

## Solution : Le Vivant en 3 couches

Transformer l'onglet **Vivant** pour qu'il utilise le `marche_id` actif (deja disponible via le step selector) et afficher 3 sous-sections visuellement distinctes :

```text
  ┌─────────────────────────────────┐
  │  🌿 Vivant                      │
  │                                 │
  │  ── Le territoire ──────────── │
  │  42 especes · Indice 7.2       │
  │  🐦 16 oiseaux  🌿 26 plantes │
  │  [Top 6 especes avec photos]   │
  │                                 │
  │  ── Les marcheurs ─────────── │
  │  3 photos · 1 son · 2 textes  │
  │  [miniatures partagees]        │
  │                                 │
  │  ── Mon regard ────────────── │
  │  1 photo · 0 son · 1 texte    │
  │  [mes contributions]           │
  └─────────────────────────────────┘
```

### Couche 1 — Le Territoire (donnees open data)
- Query `biodiversity_snapshots` par `marche_id` (pas par lat/lng)
- Affiche stats globales + top especes extraites de `species_data` avec photos
- Lien "Explorer tout" vers la page bioacoustique existante

### Couche 2 — Les Marcheurs (contributions communautaires)
- Photos, sons, textes de TOUS les participants pour cette marche
- Query `marche_photos`, `marche_audio`, `marche_textes` par `marche_id`
- Apercu compact (3 miniatures max + compteur "+N")

### Couche 3 — Mon Regard (mes contributions)
- Memes tables filtrees par `user_id` du marcheur connecte
- Mise en valeur avec bordure doree

### Simplification UX
Les onglets Voir/Ecouter/Lire/Vivant actuels decoupent par type de media. La proposition les fusionne dans un seul flux vertical par couche (territoire → communaute → moi), ce qui est plus naturel pour repondre a "qu'est-ce qui s'est passe ici ?". On garde les 4 onglets mais on enrichit Vivant pour qu'il devienne le vrai tableau de bord de la marche.

## Fichiers impactes

| Fichier | Changement |
|---------|-----------|
| `src/components/community/MarcheDetailModal.tsx` | Refactorer `VivantTab` : recevoir `marcheId` au lieu de `marcheEventId`, query par `marche_id`, ajouter les 3 sous-sections (territoire/marcheurs/mon regard) avec top especes |

