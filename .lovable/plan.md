

# Le Carnet Vivant — Navigation par marches au sein de l'événement

## Constat

Actuellement, quand le marcheur ouvre la modale d'un événement, les données sont agrégées en vrac depuis toutes les marches de l'exploration associée. Le marcheur ne peut pas distinguer ce qu'il a vécu lors de la marche 1 vs la marche 2 d'un même événement (ex: la transhumance de 2 jours a 2 marches distinctes).

## Proposition : Le Chemin des Étapes

La modale devient un **parcours narratif** où chaque marche de l'exploration est une étape que le marcheur peut feuilleter, comme les pages d'un carnet de voyage.

```text
  ╔═══════════════════════════════════╗
  ║  NOUAILLE-MAUPERTUIS              ║
  ║  07 mars 2026 · Flore sauvage    ║
  ║                                   ║
  ║  ┌───────────────────────────┐    ║
  ║  │  Étape 1/2                │    ║
  ║  │  🌿 Nous deux entre vers  │    ║
  ║  │  ◄          ●  ○         ►│    ║
  ║  └───────────────────────────┘    ║
  ║                                   ║
  ║  ┌────┬────────┬──────┬──────┐   ║
  ║  │Voir│Écouter │ Lire │Vivant│   ║
  ║  └────┴────────┴──────┴──────┘   ║
  ║                                   ║
  ║   [galerie photos de cette       ║
  ║    marche spécifique]            ║
  ╚═══════════════════════════════════╝
```

### Fonctionnement

1. A l'ouverture de la modale, on charge les marches liées via `marche_events.exploration_id` → `exploration_marches` → `marches`
2. Un **sélecteur d'étape** (swipeable ou flèches gauche/droite) permet de naviguer entre les marches, avec des dots indicateurs
3. Chaque étape affiche le nom de la marche et ses 4 onglets sensoriels (Voir/Écouter/Lire/Vivant) filtrés sur le `marche_id` spécifique
4. Si l'exploration ne contient qu'une seule marche, le sélecteur d'étape est masqué (comportement actuel)
5. Un **résumé de l'exploration** en en-tête montre les totaux cumulés (ex: "12 photos · 3 sons · 2 textes · 14 espèces")

### Données filtrées par marche

Les requêtes actuelles (VoirTab, EcouterTab, etc.) récupèrent déjà par `marche_id`. Il suffit de passer le `marche_id` sélectionné au lieu de tous les marche_ids de l'exploration.

## Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| `src/components/community/MarcheDetailModal.tsx` | Ajouter la couche de navigation par étapes : charger les marches de l'exploration, sélecteur d'étape avec dots, passer le `marche_id` actif aux onglets au lieu de charger tout en vrac |
| `src/hooks/useMarcheCollectedData.ts` | Aucun changement (agrège déjà par event) |

