

# Le Carnet Vivant — Mémoire immersive des marches

## Vision

Quand un marcheur a vécu 20 marches, sa liste actuelle (11px, lignes compressées) devient un cimetière de dates. Il faut transformer le "Mon carnet de route" en une **mémoire vivante et sensorielle** — un objet que le marcheur a envie de rouvrir, comme un album photo qu'on feuillette au coin du feu.

## Concept : La Frise des Saisons

Le carnet de route devient une **frise chronologique verticale** organisée par saisons. Chaque marche est une "perle" sur un fil du temps, avec un aperçu visuel immédiat de ce qui a été récolté.

```text
  ╔══════════════════════════════╗
  ║   🌿 Mon carnet vivant (8)  ║
  ║   ─── Printemps 2026 ───    ║
  ║                              ║
  ║   ┌──────────────────────┐   ║
  ║   │ 📍 Beynac · 15 mars  │   ║
  ║   │ ┌────┬────┬────┐     │   ║
  ║   │ │ 🖼 │ 🎵 │ ✍️ │     │   ║
  ║   │ │ 12 │  3 │  1 │     │   ║
  ║   │ └────┴────┴────┘     │   ║
  ║   │ 🦅 14 espèces · Kigo │   ║
  ║   └──────────────────────┘   ║
  ║              │               ║
  ║   ┌──────────────────────┐   ║
  ║   │ 📍 Nouaille · 8 mars │   ║
  ║   │ ...                  │   ║
  ║   └──────────────────────┘   ║
  ║                              ║
  ║   ─── Hiver 2025-26 ───     ║
  ║   ...                        ║
  ╚══════════════════════════════╝
```

### Chaque carte-marche affiche en un coup d'œil :

1. **Lieu + date** (titre principal)
2. **3 pastilles-compteurs** : Photos · Sons · Textes — avec icônes et nombres
3. **Ligne biodiversité** : nombre d'espèces observées (depuis `biodiversity_snapshots`)
4. **Kigo** : le mot de saison choisi ce jour-là (depuis `kigo_entries`)
5. **Au tap** → ouvre une **fiche détaillée** de la marche

### La fiche détaillée (modale ou sous-page)

Quand le marcheur tape sur une carte, il accède à un écran organisé en **4 onglets sensoriels** (cohérent avec les 4 temps de la marche) :

| Onglet | Contenu | Source |
|--------|---------|--------|
| **Voir** | Galerie photos/vidéos en grille | `marche_photos`, `marche_videos` |
| **Écouter** | Lecteur audio + spectrogramme | `sound_recordings`, `marche_audio` |
| **Lire** | Kigo + haïku + textes libres | `kigo_entries`, `marche_textes` |
| **Vivant** | Biodiversité : espèces, index, météo | `biodiversity_snapshots`, `weather_snapshots` |

## Intégration dans l'espace

Deux options complémentaires :

1. **Dans l'onglet Marches** : remplacer la section "Mon carnet de route" actuelle par cette frise (les participations validées uniquement)
2. **L'onglet Carnet** (déjà prévu pour les éclaireurs+) : y placer la version complète avec filtres par saison, recherche par lieu, et statistiques cumulées

Pour la Phase 1, on transforme uniquement la section dans l'onglet Marches — l'onglet Carnet dédié viendra ensuite.

## Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| `src/components/community/tabs/MarchesTab.tsx` | Remplacer la section carnet de route par le composant `CarnetVivant` |
| `src/components/community/CarnetVivant.tsx` | **Nouveau** — Frise chronologique par saison avec cartes-résumé |
| `src/components/community/MarcheDetailModal.tsx` | **Nouveau** — Modale 4 onglets (Voir/Écouter/Lire/Vivant) |
| `src/hooks/useMarcheCollectedData.ts` | **Nouveau** — Hook agrégateur qui charge photos, sons, kigos, biodiv pour une marche donnée |

## Données déjà disponibles

Toutes les tables nécessaires existent : `marche_photos`, `marche_audio`, `marche_videos`, `marche_textes`, `sound_recordings`, `kigo_entries`, `biodiversity_snapshots`, `weather_snapshots`. Les relations passent par `marche_id` ou `marche_event_id`. Aucune migration nécessaire.

