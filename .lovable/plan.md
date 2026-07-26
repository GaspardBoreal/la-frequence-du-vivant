## Objectif

Supprimer le bandeau « Signature du sol » (bande grise/beige avec la courbe orange A→E et la date) de la synthèse « J'analyse le sol », à l'écran comme à l'impression.

## Modification

`src/components/propriete/analyze/AnalyzeSummary.tsx`
- Retirer le rendu `<SoilSignature reading={r} dateStr={dateStr} />` (ligne 327), situé entre le plan des prélèvements et la « Lecture dominante ».
- Retirer l'import associé (ligne 7) et, si `dateStr` n'est plus utilisé ailleurs dans le fichier, nettoyer la variable devenue inutile.

Comme ce composant est le seul rendu partagé écran/impression (le layout d'impression réutilise `AnalyzeSummary`), le bandeau disparaît automatiquement des deux sorties : « J'analyse (seul) » et « Cahier complet ».

## Notes techniques

Le fichier `SoilSignature.tsx` n'est plus référencé nulle part après cette suppression ; il sera supprimé pour éviter du code mort (aucun autre appel détecté).
