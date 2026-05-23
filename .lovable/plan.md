
## Objectif

Permettre aux **ambassadeurs / sentinelles / admin** de corriger en 2 clics les tags écologiques (arbre, mellifère, vieil arbre, fixateur d'azote…) d'une espèce, depuis la vignette espèce du module **Découverte du vivant**. Et leur signaler clairement, dans le back-office, les espèces "à valider" (faible confiance ou auto-classifiées).

## 1. Où l'UI est posée — côté curateur

**Emplacement principal :** dans le drawer espèce ouvert depuis le module **Analyse IA → Partons à la découverte du vivant** (composant `EcologicalJourneyCarousel`).

Sur chaque `SpeciesGridCard`, un petit bouton discret en haut-droite : icône crayon (`Pencil`), visible **uniquement** si l'utilisateur est curateur (`useIsCurator(explorationId)`).

Clic → ouverture d'un `Sheet` (bottom sur mobile, right sur desktop) intitulé **"Ajuster les tags écologiques"** avec :

- En-tête : photo + nom FR + nom scientifique
- Bloc "Tags actuels (auto)" : les 12 fonctions affichées en chips, cliquables pour activer/désactiver
- Chip = état tri-valeurs visuel :
  - ✓ vert : "Confirmé" (curaté actif)
  - − rouge clair : "Retiré" (curaté inactif)
  - · neutre + halo : "Auto" (classifier, non touché)
- Champ optionnel "Note du curateur" (1 ligne)
- Toggle "Proposer pour la base globale" (réservé aux sentinelles/admin — création d'une note dans `species_curation_proposals` pour enrichir `species-knowledge-base.json` lors d'une prochaine release)
- Boutons : Annuler · Enregistrer

**Mobile-first** : sheet plein écran < md, animations Motion (déjà présentes ailleurs), gros boutons tactiles, haptic-feedback léger.

## 2. Signalement "il y a quelque chose à faire"

Trois niveaux d'indicateurs, du plus contextuel au plus global :

**a) Sur la vignette espèce** — petit point orange pulsant en haut-gauche si `needs_review = true` OU si `classification_confidence < 0.6` OU si aucun tag n'a été attribué alors que l'espèce a > 3 observations. Tooltip : "À valider".

**b) Sur le bouton parcours** (carte "Arbres", "Mellifères"…) — badge `n à valider` discret en bas du card, uniquement visible pour les curateurs.

**c) Hub curation dédié** : nouvelle page `/marches-du-vivant/mon-espace/exploration/:id/curation-vivant` accessible depuis :
- l'onglet **Analyse IA**, header, bouton secondaire **"Curation vivant · n à valider"** (visible curateurs uniquement)
- le menu Outils de mon-espace (catégorie Ambassadeur/Sentinelle)

Cette page liste, en une seule vue scrollable :
- Espèces sans aucun tag (priorité haute)
- Espèces avec confiance faible (< 0.6)
- Espèces signalées `needs_review`
- Espèces récemment éditées par d'autres curateurs (transparence)

Chaque ligne = mini-card avec photo, nom, tags actuels, et bouton "Ajuster" qui ouvre le même Sheet qu'en (1).

## 3. Logique métier

- La curation est **stockée dans `exploration_curations`** avec :
  - `entity_type = 'species'`
  - `entity_id = scientific_name`
  - `sense = 'oeil'` (sens utilisé pour le visuel/biodiversité)
  - une nouvelle colonne **`functions text[]`** = liste des tags activés (override total : si présente, remplace l'auto-classification)
  - `classification_source = 'curator'`, `classification_confidence = 1.0`, `needs_review = false`
- `useEcologicalFunctions` lit d'abord les curations, applique les overrides, puis retombe sur l'auto-classification (cf. logique déjà en place pour le pont strate).
- Permissions : RLS existant déjà adapté (ambassadeur/sentinelle participant à un évènement de l'exploration, + admin partout). L'écriture passe par `useUpsertCuration` déjà en place.

## 4. Notifications légères (optionnel mais recommandé)

Dans le **hub admin/sentinelle** (`AdminOutilsHub` ou la page communauté), un compteur global "**n espèces à valider sur k explorations actives**" — agrégation côté Edge Function pour ne pas casser les perfs.

Pas d'email/push pour rester sobre (cf. mémoire Sobriété Informationnelle).

## Périmètre technique

```text
DB migration                                  ALTER exploration_curations ADD functions text[]
                                              + index partial sur needs_review/confidence
src/hooks/useEcologicalFunctions.ts           lit + applique overrides curation
src/hooks/useSpeciesCurationStatus.ts         NEW — agrège needs_review par exploration
src/components/biodiversity/
  EcologicalJourneyCarousel.tsx               + bouton crayon sur SpeciesGridCard
  SpeciesEcoTagsEditor.tsx                    NEW — Sheet édition tags
  SpeciesGridCard.tsx (extraction)            + dot "à valider" + bouton curateur
src/components/community/analyse/
  AnalyseIAStepper.tsx                        + bouton header "Curation vivant"
src/pages/
  ExplorationCurationVivant.tsx               NEW — hub liste à valider
src/App.tsx (routes)                          + route /curation-vivant
```

## Points hors-scope (à valider plus tard)

- Synchronisation curation → KB globale (table `species_curation_proposals` créée mais workflow de PR manuel)
- Historique des éditions par curateur (audit trail) — non prioritaire
- Édition multi-espèces en masse — V2 si besoin

## Question rapide avant de coder

Confirmes-tu ces 3 points :
1. Bouton crayon sur **chaque vignette** dans le drawer du parcours (et non en haut du drawer) — OK ?
2. La page hub `/curation-vivant` est créée même si on peut déjà tout faire depuis les vignettes — OK pour avoir une vue agrégée ?
3. Le compteur global "n à valider" sur AdminOutilsHub — on l'ajoute dans ce lot ou plus tard ?
