
# Plan : Génération Intelligente des Métadonnées EPUB

## Problème Identifié

Les champs **Titre**, **Sous-titre** et **Description** sont actuellement des placeholders génériques ("Bonzac en intimité partagée", "Sous-titre ou accroche", "Description pour les métadonnées EPUB...") qui ne reflètent pas l'intelligence littéraire de Gaspard Boréal ni le contenu réellement sélectionné par les filtres.

## Solution Proposée : Double Intelligence

### 1. Intelligence Contextuelle (Automatique)
Génération dynamique basée sur l'analyse des données filtrées :
- Extraction des **parties** (mouvements geopoétiques) présentes
- Analyse des **lieux** uniques traversés
- Identification des **types littéraires** dominants
- Détection de la **région** principale

**Exemples de titres générés automatiquement :**
```text
Filtre: Exploration Dordogne complète
→ "Fréquence de la rivière Dordogne"
→ Sous-titre: "Du Bec d'Ambès aux sources — Haïkus, fables et manifestes"

Filtre: Seulement haïkus
→ "Haïkus de la Dordogne"
→ Sous-titre: "49 instants de rivière en Nouvelle-Aquitaine"

Filtre: Une seule marche (Bonzac)
→ "Bonzac — Là où elle se jette"
→ Sous-titre: "Carnet de marche poétique"
```

### 2. Intelligence Poétique (IA via Lovable AI)
Un bouton **"✨ Inspiration poétique"** qui appelle une Edge Function dédiée pour générer des métadonnées dignes d'un poète :

**Prompt système inspiré de l'identité Gaspard Boréal :**
- Poète des mondes hybrides
- Convergence IA/Vivant
- Méthode "Inspirer, Simplifier, Agir"
- Vocabulaire riverain et écologique

**Résultat attendu :**
```text
Titre: "Fréquence du Vivant"
Sous-titre: "Là où le réel commence quand le modèle hésite"
Description: "Un recueil de 49 textes — haïkus, fables, manifestes — 
composés le long de la Dordogne, de son estuaire aux sources du Puy de Sancy.
Gaspard Boréal y tisse une cartographie sensible où algorithmes et martinets,
barrages et truites, cohabitent dans une même partition écologique."
```

## Architecture Technique

### Nouveaux Fichiers

| Fichier | Description |
|---------|-------------|
| `supabase/functions/generate-epub-metadata/index.ts` | Edge Function pour génération IA des métadonnées |
| `src/utils/epubMetadataGenerator.ts` | Utilitaire de génération contextuelle locale |

### Fichiers Modifiés

| Fichier | Modification |
|---------|-------------|
| `src/components/admin/EpubExportPanel.tsx` | Intégration des générateurs + bouton IA |

## Détail de l'Implémentation

### Phase 1 : Générateur Contextuel Local

**Nouveau fichier `src/utils/epubMetadataGenerator.ts` :**

```text
Interface EpubMetadataSuggestion {
  title: string;
  subtitle: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

Fonction generateContextualMetadata(textes, explorationName?) → EpubMetadataSuggestion

Logique:
1. Extraire les parties uniques (ex: "LE CONTRE-COURANT", "L'HÉSITATION DU MODÈLE")
2. Extraire les lieux uniques (villes/marches)
3. Compter les types de textes (haïkus, fables, etc.)
4. Identifier la région dominante

Règles de génération:
- Si 1 seule partie → Utiliser son titre ("Le Contre-Courant")
- Si plusieurs parties → Utiliser le nom de l'exploration
- Si 1 seul lieu → Utiliser le nom du lieu + accroche
- Si plusieurs types → Énumérer les dominants dans le sous-titre
- Description auto-générée avec statistiques élégantes
```

### Phase 2 : Générateur IA (Edge Function)

**Nouveau fichier `supabase/functions/generate-epub-metadata/index.ts` :**

```text
Endpoint: POST /functions/v1/generate-epub-metadata

Payload:
{
  textes: [{titre, type_texte, marche_ville, partie_titre}...],
  explorationName?: string,
  stats: { totalTextes, uniqueLieux, typesDistribution }
}

Prompt système (inspiré de l'identité Gaspard Boréal):
"Tu es le conseiller éditorial de Gaspard Boréal, poète des mondes hybrides.
Ton rôle est de proposer des métadonnées éditoriales pour un recueil EPUB
destiné aux grands éditeurs de poésie nationale (Gallimard, Le Seuil, Actes Sud).

Le style Gaspard Boréal:
- Convergence entre le vivant et l'algorithmique
- Phrases courtes, évocatrices, sans verbiage
- Vocabulaire riverain (estuaire, méandre, bief, alose, mascaret)
- Tension entre observation scientifique et émotion poétique
- Maxime centrale: 'Là où le réel commence quand le modèle hésite'

Tu dois proposer:
1. Un TITRE percutant (3-6 mots)
2. Un SOUS-TITRE évocateur (10-15 mots)
3. Une DESCRIPTION pour quatrième de couverture (50-80 mots)"

Réponse JSON structurée via tool calling
```

### Phase 3 : Interface Utilisateur

**Modifications de `EpubExportPanel.tsx` :**

```text
Section Métadonnées enrichie:

┌─────────────────────────────────────────────────────────────┐
│ 📄 Métadonnées éditoriales                     [✨ Inspirer] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Titre                          Auteur                       │
│ ┌─────────────────────────┐    ┌─────────────────────────┐ │
│ │ Fréquence du Vivant     │    │ Gaspard Boréal          │ │
│ └─────────────────────────┘    └─────────────────────────┘ │
│                                                             │
│ Sous-titre (optionnel)                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Du Bec d'Ambès aux sources — Haïkus, fables et manifestes│ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Description                                       [↻ Regénérer]│
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Un recueil de 49 textes — haïkus, fables, manifestes —  │ │
│ │ composés le long de la Dordogne, de son estuaire aux    │ │
│ │ sources du Puy de Sancy. Gaspard Boréal y tisse une     │ │
│ │ cartographie sensible où algorithmes et martinets...    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 💡 Généré automatiquement d'après 49 textes • 16 lieux     │
│    Cliquez "✨ Inspirer" pour une version poétique IA      │
└─────────────────────────────────────────────────────────────┘
```

**Nouvelles fonctionnalités:**
1. **Auto-remplissage au chargement** : `useEffect` qui appelle `generateContextualMetadata()` quand les textes changent
2. **Bouton "✨ Inspirer"** : Appelle l'Edge Function pour génération IA poétique
3. **Indicateur de source** : Badge "Généré automatiquement" ou "Inspiré par IA"
4. **Bouton "↻ Regénérer"** : Permet de relancer la génération contextuelle

## Flux Utilisateur

```text
1. L'utilisateur sélectionne des filtres (exploration, marches, types)
   ↓
2. Le panneau EPUB se rafraîchit (bouton Rafraîchir ou auto)
   ↓
3. generateContextualMetadata() analyse les textes filtrés
   ↓
4. Les champs Titre/Sous-titre/Description sont pré-remplis intelligemment
   ↓
5. (Optionnel) L'utilisateur clique "✨ Inspirer"
   ↓
6. Edge Function génère des métadonnées poétiques via Lovable AI
   ↓
7. L'utilisateur ajuste si besoin avant export
```

## Exemples de Génération Contextuelle

| Filtre Sélectionné | Titre Généré | Sous-titre | Description |
|-------------------|--------------|------------|-------------|
| Exploration complète (49 textes, 16 lieux) | Fréquence de la rivière Dordogne | Du Bec d'Ambès aux sources — Haïkus, fables et manifestes | Un recueil de 49 textes traversant 16 lieux de Nouvelle-Aquitaine, mêlant haïkus, poèmes et manifestes dans une exploration poétique de la Dordogne. |
| Seulement Partie I (36 textes) | Le Contre-Courant | L'Observation — 36 textes de l'estuaire aux basses vallées | Premier mouvement d'une trilogie riveraine : 36 textes composés entre le Bec d'Ambès et Saint-Michel de Fronsac. |
| Seulement Haïkus (24 textes) | Haïkus de la Dordogne | 24 instants de rivière en Nouvelle-Aquitaine | Recueil de 24 haïkus composés lors de marches le long de la Dordogne, captant l'essence fugitive des paysages fluviaux. |
| Une seule marche (Bonzac) | Bonzac — Là où elle se jette | Carnet de marche poétique | Exploration poétique de Bonzac, entre estuaire et confluences. |

## Exemple de Génération IA (après clic "✨ Inspirer")

**Input stats:** 49 textes, 16 lieux, 7 genres, exploration "Fréquence de la rivière Dordogne"

**Output IA:**
```json
{
  "title": "Fréquence du Vivant",
  "subtitle": "Là où le réel commence quand le modèle hésite",
  "description": "De l'estuaire aux sources, 49 textes tissent une cartographie sensible de la Dordogne. Haïkus captés à l'aube, fables où dialoguent aloses et algorithmes, manifestes pour un nouveau pacte entre l'homme et la rivière. Gaspard Boréal y déploie sa poétique hybride : celle d'un monde où le mascaret répond aux capteurs, où la truite arc-en-ciel croise les modèles prédictifs."
}
```

## Section Technique

### Fichiers à Créer

1. **`src/utils/epubMetadataGenerator.ts`** : Générateur contextuel local
2. **`supabase/functions/generate-epub-metadata/index.ts`** : Edge Function IA

### Fichiers à Modifier

1. **`src/components/admin/EpubExportPanel.tsx`** :
   - Import du générateur contextuel
   - Ajout `useEffect` pour auto-génération au changement de textes
   - Ajout bouton "✨ Inspirer" avec appel Edge Function
   - Badge indicateur de source (auto/IA)
   - Bouton regénérer

### Dépendances

Aucune nouvelle dépendance requise (utilise Lovable AI existant)

## Résultat Attendu

Un système de métadonnées EPUB qui :
1. **Ne laisse jamais de champs vides** — Toujours pré-remplis intelligemment
2. **S'adapte aux filtres** — Change dynamiquement selon la sélection
3. **Offre l'inspiration poétique** — Génération IA digne de Gaspard Boréal
4. **Reste éditable** — L'utilisateur garde le contrôle final
5. **Impressionne les éditeurs** — Qualité professionnelle des métadonnées

