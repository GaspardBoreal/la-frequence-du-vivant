# Espace VDTP : configurateur officiel figé, configurateur enrichi, synthèse mensuelle

## Les trois pages

1. **`/partenaires/vdtp/configurateur-18-09-2026` — Présentation officielle (figée)**
   - Copie exacte du configurateur actuel (mêmes briques, poids, paniers, formule 15 k€ → 50 k€).
   - Bandeau daté : « Présentation officielle — 18 septembre 2026 · version de référence, non modifiée ».
   - Son catalogue est gelé dans un fichier à part : les ajouts futurs ne le touchent jamais.

2. **`/partenaires/vdtp/configurateur` — Configurateur enrichi (évolutif)**
   - Reprend les briques du 18.09 et ajoute celles livrées depuis (Plan d'action IA, Cortège vivant, Journal…), chacune marquée « Nouveau depuis le 18.09 » avec sa date.
   - Filtre en tête : « Périmètre du 18.09 » / « Nouveautés depuis » / « Tout ».
   - Lecture comparée : prix du périmètre 18.09 vs prix enrichi, pour montrer la valeur ajoutée sans renégocier la base.
   - Les liens de sélection déjà partagés restent valides (anciens identifiants conservés).

3. **`/partenaires/vdtp/journal` — Journal + synthèse graphique mensuelle**
   - Nouveau bloc en tête : histogramme mensuel (juillet 2026 → mois courant) des briques livrées, empilé par pilier Observer / Mesurer / Raconter / Piloter, avec courbe cumulée et repère vertical « 18.09 présentation officielle ».
   - Toucher un mois filtre la frise en dessous. Mobile first.

## Navigation entre les trois pages (priorité)

Une barre de navigation partagée, identique en haut des trois pages, collante sur mobile :

```text
[ Journal des briques ] [ Configurateur 18.09.2026 ] [ Configurateur enrichi ]
```

- Onglet actif mis en évidence ; les autres en un geste.
- Rappel en bas de page : « Voir aussi » avec les deux autres pages + lien vers la proposition `/offre-VDT-MDV`.
- La sélection en cours est transmise quand on passe d'un configurateur à l'autre (même lien encodé).
- Un seul mot de passe partenaire déverrouille les trois pages (session partagée existante).

## Détails techniques

- `src/content/vdtp/configurateur-2026-09-18.ts` : snapshot figé du catalogue actuel (`CONFIG_OPTIONS`, grilles, paniers) ; ne plus jamais l'éditer.
- `src/content/vdtp/configurateur.ts` : catalogue évolutif = snapshot + nouvelles options avec champ `addedOn` (date ISO) ; les nouvelles options sont reliées aux entrées du journal.
- `src/lib/vdtp/pricing.ts` : `computePrice` rendu paramétrable par catalogue (options, poids totaux).
- Page du configurateur refactorée en composant commun `VdtpConfigurateurView` avec props `catalog`, `mode: 'officiel' | 'enrichi'` ; deux pages fines (`VdtpConfigurateurOfficiel.tsx`, `VdtpConfigurateur.tsx`).
- Nouveau `src/components/partners/vdtp/VdtpNav.tsx` (barre partagée) et `VdtpMonthlyChart.tsx` (recharts, tokens sémantiques) calculé depuis `JOURNAL_ENTRIES`.
- Route ajoutée dans `src/App.tsx` ; pages en noindex, hors sitemap.
- Aucune modification de base de données. Mise à jour de la mémoire du journal VDTP.
- Vérification : compilation, rendu 375 px des trois pages, navigation croisée depuis chacune.
