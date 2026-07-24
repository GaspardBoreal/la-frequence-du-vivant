# Amplifier l'exploitation des données marcheurs dans "J'identifie"

Aujourd'hui, les données marcheurs alimentent seulement 2 endroits : le bandeau BiodiversityEvidenceBlock (KPIs + SpeciesExplorer) et le Cortège Révélé (matching KB 40 plantes). On laisse dormir 90 % du potentiel : géolocalisation, dates, marcheurs individuels, familles écologiques, iNaturalist, corrélations sol↔flore réelles.

## 6 modules à ajouter dans "J'identifie"

### 1. Carte des révélations (mini-RichMap)
Carte compacte au-dessus du Cortège, centrée sur la propriété, affichant :
- Waypoints réels des observations marcheurs (photos cliquables)
- Heatmap densité par règne (Plantae / Animalia / Fungi)
- Filtre "N'afficher que les bio-indicatrices du KB"
- Clic sur point → ouvre drawer espèce (déjà existant)
Vraie preuve terrain : "voilà où Corylus avellana a été photographié le 23/07".

### 2. Frise chronologique des passages
Timeline horizontale : chaque marche = une bulle datée avec nb d'espèces révélées ce jour-là et nom du marcheur principal. Permet de voir la dynamique : "Depuis mai, 3 marches → +18 bio-indicatrices révélées". Renforce la boucle "plus de marches = plus de révélations".

### 3. Sentinelles du lieu (marcheurs contributeurs)
Cards des marcheurs ayant contribué sur cette propriété (avatar, rôle Ambassadeur/Sentinelle, nb d'observations, dernière visite). Humanise la donnée, ouvre vers portfolio marcheur. Utilise déjà les hooks community existants.

### 4. Concordance Sol↔Flore RÉELLE (upgrade ConcordanceBlock)
Actuellement basé sur cases cochées manuellement. Nouvelle version : croiser automatiquement le diagnostic sol (TabAnalyze) avec les bio-indicatrices DÉJÀ révélées par les marcheurs. Verdict enrichi : "Sol argileux annoncé + Rumex + Juncus + Renoncule révélés par marcheurs = compaction confirmée à 92%". Score de fiabilité pondéré par nb d'observations.

### 5. Familles écologiques révélées (au-delà des 40 plantes)
Extension aux 12 tags fonctionnels (mellifère, fixateur azote, arbre nourricier…) déjà classifiés dans species_eco_tags_kb. Grille : "Sur votre propriété, les marcheurs ont révélé : 14 mellifères, 3 fixateurs d'azote, 8 arbres nourriciers". Chaque tag ouvre la liste des espèces. Directement branché sur l'infra eco tags existante.

### 6. Delta entre visites (nouveautés & disparitions)
Encart "Depuis votre dernière connexion" : X nouvelles espèces révélées, Y espèces re-confirmées. Basé sur snapshot_history + validated_at. Crée un rituel de retour ("qu'ont vu les marcheurs cette semaine ?").

## Nouveaux fichiers
- `src/components/propriete/identify/blocks/RevealMapBlock.tsx` — mini RichMap + filtres
- `src/components/propriete/identify/blocks/TimelineBlock.tsx` — frise passages marcheurs
- `src/components/propriete/identify/blocks/SentinellesBlock.tsx` — grille marcheurs
- `src/components/propriete/identify/blocks/EcoFunctionsBlock.tsx` — grille 12 fonctions
- `src/components/propriete/identify/blocks/DeltaBlock.tsx` — nouveautés depuis N jours
- `src/hooks/propriete/usePropertyWaypoints.ts` — waypoints géolocalisés
- `src/hooks/propriete/usePropertyContributors.ts` — marcheurs contributeurs
- `src/hooks/propriete/usePropertyEcoFunctions.ts` — agrégation tags fonctionnels
- `src/hooks/propriete/usePropertyDelta.ts` — diff snapshots récent vs historique

## Fichiers modifiés
- `src/components/propriete/tabs/TabIdentify.tsx` — nouvelle composition des blocs
- `src/components/propriete/identify/blocks/ConcordanceBlock.tsx` — pondération observations réelles

## Ordre proposé dans TabIdentify
1. BiodiversityEvidenceBlock (existant)
2. **DeltaBlock** (accroche retour)
3. **RevealMapBlock** (preuve spatiale)
4. **TimelineBlock** (preuve temporelle)
5. CortegeBlock (existant, matching KB)
6. **EcoFunctionsBlock** (fonctions écologiques)
7. IntensitiesBlock (existant)
8. ConcordanceBlock (upgraded — sol × flore révélée)
9. **SentinellesBlock** (humains derrière la donnée)

## Question avant de lancer
Veux-tu que je livre **les 6 blocs d'un coup**, ou qu'on **priorise 2-3 blocs** pour livrer un impact visible plus vite ? Recommandation perso : commencer par **Carte des révélations + Delta + Sentinelles** (les 3 plus wahou visuellement et les plus rapides à brancher sur l'existant).
