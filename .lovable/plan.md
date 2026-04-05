

## Système de Connaissances & Inspiration contextuelles — Architecture complète

### Vision

Un moteur de contenus hybride (éditorial + IA) qui délivre formation, inspiration, incitation à la création et valorisation des données, adapté à 4 dimensions : **niveau du marcheur** (Marcheur → Sentinelle), **vue** (Empreinte globale / Marche individuelle), **type d'événement** (Agroécologique / Éco poétique / Éco tourisme), et **angle de vue** (Biodiversité / Bioacoustique / Géopoétique).

### Architecture en 4 couches

```text
┌─────────────────────────────────────────────────────────────┐
│  1. TABLE : insight_cards (contenus éditoriaux tagués)      │
│     level, event_type, angle, view, category                │
├─────────────────────────────────────────────────────────────┤
│  2. EDGE FUNCTION : generate-contextual-insights            │
│     Reçoit données réelles + contexte → enrichit via IA     │
├─────────────────────────────────────────────────────────────┤
│  3. HOOK : useInsightCards(level, eventType, angle, view)   │
│     Fusionne éditorial + IA, filtre par niveau cumulatif    │
├─────────────────────────────────────────────────────────────┤
│  4. UI : InsightPanel (encarts) + onglet "Apprendre"        │
│     Intégrés dans EventBiodiversityTab, MarcheDetailModal   │
│     + nouvel onglet dédié dans ExplorationMarcheurPage      │
└─────────────────────────────────────────────────────────────┘
```

### 1. Table Supabase : `insight_cards`

Stocke les contenus éditoriaux de base, chacun tagué par ses dimensions.

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | |
| title | text | Titre de la carte |
| content | text | Contenu markdown |
| category | enum | `formation`, `inspiration`, `experimentation`, `partage`, `valorisation` |
| min_level | enum community_role | Niveau minimum requis (marcheur, eclaireur, ambassadeur, sentinelle) |
| event_type | text[] | Types d'événement applicables (agroecologique, eco_poetique, eco_tourisme) |
| angle | text[] | Angles applicables (biodiversite, bioacoustique, geopoetique) |
| view | text | `empreinte` ou `marche` ou `both` |
| display_mode | text | `card` (encart contextuel), `full` (onglet dédié), `both` |
| icon_name | text | Nom d'icône Lucide |
| ordre | integer | Ordre d'affichage |
| active | boolean | |
| created_at, updated_at | timestamps | |

**Logique de filtrage cumulatif** : un marcheur "Eclaireur" voit les cartes avec `min_level IN ('marcheur', 'eclaireur')`. Pas de lookup complexe : on compare le rang numérique du niveau utilisateur avec celui de la carte.

### 2. Edge Function : `generate-contextual-insights`

Prend les données réelles d'un événement (espèces, snapshots, participants) + le contexte (type, angle, niveau) et génère via Lovable AI des insights personnalisés :

- **Formation** : "Sur vos 21 espèces, 3 sont bio-indicatrices de sols calcaires. Voici pourquoi…"
- **Inspiration** : "Le mésange charbonnière que vous avez observée est un indicateur clé de la santé forestière"
- **Expérimentation** : "Essayez d'enregistrer le chant de la mésange à l'aube — comparez avec le spectre Xeno-Canto"
- **Partage** : "Partagez votre transect avec la communauté. 2 marcheurs ont documenté la même zone"
- **Valorisation** : "Votre collecte couvre 87% des taxons GBIF de la zone — données de qualité recherche"

Le prompt système est branché selon `event_type` + `angle` pour adapter le ton (technique pour agroécologique/biodiversité, poétique pour éco_poétique/géopoétique, etc.).

### 3. Hook React : `useInsightCards`

```ts
useInsightCards({
  userLevel: 'eclaireur',      // du profil communautaire
  eventType: 'agroecologique', // du marche_event
  angle: 'biodiversite',       // onglet actif
  view: 'empreinte',           // ou 'marche'
  explorationId: '...',        // pour les données réelles
  marcheEventId: '...',
})
```

Retourne :
- `editorialCards` : cartes de la table `insight_cards` filtrées
- `aiInsights` : insights générés par l'edge function (cachés 5 min)
- `combinedCards` : fusion triée par catégorie + ordre

### 4. Composants UI

**A. Encarts contextuels (`InsightCardBanner`)** — intégrés dans les vues existantes :
- Dans `EventBiodiversityTab` (Empreinte) : entre la synthèse et les taxons
- Dans `MarcheDetailModal` / onglets sensoriels : en haut de chaque vue
- Format léger : icône + titre + contenu court + badge niveau

**B. Nouvel onglet "Apprendre & Créer"** dans `ExplorationMarcheurPage` :
- Ajout d'un 6e onglet global : `{ key: 'apprendre', label: 'Apprendre', icon: GraduationCap }`
- Sous-sections par catégorie : Former / Inspirer / Créer / Partager / Impact
- Chaque sous-section affiche les cartes éditorial + IA combinées
- Sélecteur d'angle (Biodiversité / Bioacoustique / Géopoétique) en pills
- Badge de niveau visible pour que le marcheur comprenne sa progression

**C. Bloc Valorisation Financeurs** — visible à partir du niveau Ambassadeur :
- Métriques de qualité : couverture taxonomique, concordance GBIF, densité d'observations
- Score de fiabilité des données (% de vérification croisée multi-sources)
- Export PDF de rapport d'impact territorial (réutilise le pattern GuideDeMarchePdf)
- Dashboard partenaires (futur : lien partageable avec métriques live)

### Fichiers à créer / modifier

**Créer :**
1. Migration SQL : table `insight_cards` + seed de ~30 cartes de base couvrant les combinaisons clés
2. `supabase/functions/generate-contextual-insights/index.ts` — edge function IA
3. `src/hooks/useInsightCards.ts` — hook de fusion éditorial + IA
4. `src/components/community/insights/InsightCardBanner.tsx` — encart contextuel
5. `src/components/community/insights/ApprendreTab.tsx` — onglet dédié
6. `src/components/community/insights/ValorizationBlock.tsx` — bloc métriques financeurs
7. `src/lib/insightLevels.ts` — utilitaires de comparaison de niveaux

**Modifier :**
8. `src/components/community/ExplorationMarcheurPage.tsx` — ajouter l'onglet "Apprendre"
9. `src/components/community/EventBiodiversityTab.tsx` — intégrer les encarts contextuels
10. `src/components/community/MarcheDetailModal.tsx` — intégrer les encarts dans les onglets sensoriels

### Seed éditorial initial (exemples)

| Catégorie | Niveau | Type événement | Angle | Contenu |
|-----------|--------|----------------|-------|---------|
| Formation | Marcheur | Agroécologique | Biodiversité | "Qu'est-ce qu'un bio-indicateur ? Les espèces végétales présentes ici révèlent la qualité du sol…" |
| Formation | Eclaireur | Agroécologique | Biodiversité | "Protocole d'inventaire floristique : comment structurer vos relevés sur le terrain" |
| Inspiration | Marcheur | Éco poétique | Géopoétique | "Kenneth White : 'Le paysage n'est pas devant nous, nous sommes dedans'" |
| Expérimentation | Marcheur | Éco tourisme | Bioacoustique | "Exercice : fermez les yeux 3 minutes et comptez les sources sonores distinctes" |
| Valorisation | Ambassadeur | Tous | Biodiversité | "Vos données contribuent aux objectifs CSRD de nos partenaires entreprises" |

### Stratégie de livraison

Tout est construit d'emblée avec le moteur de templates complet. Le seed éditorial couvre les combinaisons les plus fréquentes, et l'IA comble les lacunes en temps réel à partir des données collectées. Le système est extensible : ajouter de nouvelles cartes éditoriales ne nécessite qu'un INSERT dans `insight_cards`.

