

## Supprimer les cartes "SE FORMER" de Empreinte → Synthèse

### Ce qui sera fait

Retirer la ligne `<InsightCardBanner cards={insightCards} maxCards={2} />` du sous-onglet Synthèse dans `EventBiodiversityTab.tsx` (ligne 370). Cela supprime les deux bannières "SE FORMER" (bio-indicateur et GBIF) visibles sur la copie écran.

### Ce qui ne sera PAS touché

- L'onglet **Apprendre** (`ApprendreTab.tsx`) reste intact -- il a sa propre logique `useInsightCards` indépendante
- Les sous-onglets **Taxons observés** et **Analyse IA** restent inchangés
- Le hook `useInsightCards` et le composant `InsightCardBanner` restent disponibles pour les autres usages

### Fichier modifié

| Fichier | Modification |
|---------|-------------|
| `src/components/community/EventBiodiversityTab.tsx` | Supprimer l'appel `<InsightCardBanner>` dans le bloc Synthèse (ligne 370). Nettoyer l'import et le hook `useInsightCards` s'ils ne sont plus utilisés ailleurs dans ce fichier. |

