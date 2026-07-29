## Constat (vérifié)

- Les ouvrages tracés dans l'Atelier sont stockés dans `propriete_objets` (5 objets ici), avec un `outil_key` renvoyant au registre `src/lib/paysageTools.ts` (~40 outils : mare, potager, pas japonais, noue, verger…).
- Le chapitre 2 de l'onglet Palette (`src/components/propriete/tabs/TabPalette.tsx`) ne lit que `propriete_zones` : d'où « 0 emplacement » alors que l'Atelier affiche 5 objets. Aucun composant n'affiche les objets hors de l'Atelier.
- `paysageTools.ts` porte déjà coût / rétention / couverture par outil, mais aucune recommandation rédigée (mise en œuvre, entretien, végétaux).

## 1. Renommer et recadrer le chapitre 2

Titre du bloc : **« Emplacements & ouvrages »** — « Les lieux que vous découpez, les ouvrages que vous dessinez dans l'Atelier ».
Bandeau de signature honnête : `N emplacements · M ouvrages · X m² dessinés`, plus un état vide distinct quand il y a des ouvrages mais aucune zone (le cas actuel), au lieu du « 0 emplacement » trompeur.

## 2. Registre des ouvrages, plié/déplié

Nouveau composant `OuvragesRegister.tsx` sous la carte du chapitre 2 :

- objets groupés par **famille** (Eau & GIEP, Sol vivant, Nourricier, Patrimoine, Biodiversité, Usage), chaque ligne repliée montrant : glyphe, nom, type d'ouvrage, métré (`m²` / `ml` / `u`), emplacement de rattachement, pastille de couleur ;
- dépliage → **fiche de recommandation** propre au type, en 4 volets (choix validés) :
  1. **Mise en œuvre & calendrier** — étapes, saison idéale, points de vigilance,
  2. **Entretien An 0 / An 1 / An 3** — gestes et charge indicative,
  3. **Espèces & compagnonnage** — végétaux associés, croisés quand c'est possible avec la palette déjà retenue sur l'emplacement,
  4. **Coûts, eau & biodiversité** — coût conventionnel vs sol vivant, rétention L, services écologiques (réutilise `ToolImpact`) ;
- « Tout replier / Tout déplier », clic sur une ligne → sélection de l'objet et recentrage sur la carte ;
- chaque fiche affiche sa **source** (socle expert ou fiche enrichie par l'admin) et sa date de mise à jour.

## 3. Base de recommandations : socle code + surcharge en base

- `src/lib/ouvrageRecoKb.ts` : socle expert livré, une fiche rédigée par type d'ouvrage (mare ≠ potager ≠ pas japonais ≠ noue ≠ haie…), typée `OuvrageReco { miseEnOeuvre[], calendrier, entretien{an0,an1,an3}, especes[], vigilance[], sources[] }`.
- Nouvelle table `public.propriete_ouvrage_kb` (clé `outil_key` unique, champs JSONB de la fiche, `updated_by`, `updated_at`) : **base partagée à tous les sites**, lecture pour tous les utilisateurs authentifiés, écriture réservée aux admins (`has_role`), avec les GRANT correspondants. Une entrée surcharge le socle code pour ce type.
- **Notes locales** : chaque ouvrage garde une note de chantier propre à la propriété, stockée dans `propriete_objets.meta.note` (déjà en place), éditable par le gestionnaire de la propriété — jamais mélangée à la base commune.

## 4. Édition (partie éditable et enrichissable)

- Bouton crayon sur une fiche, visible **uniquement pour les admins** → panneau d'édition (mise en œuvre, calendrier, entretien 3 paliers, espèces, vigilance, sources) qui écrit dans `propriete_ouvrage_kb`, avec « Réinitialiser au socle » et un badge « Fiche enrichie ».
- Pour un non-admin : fiche en lecture seule + zone « Note de chantier » libre sur l'ouvrage.

## Design

Fiches en langage visuel existant (papier crème, liseré de couleur famille, titres serif italiques), volets en accordéon fluide, frise An 0 / 1 / 3 en timeline horizontale, chiffres d'impact en petites cartouches. Même grammaire que `ZonePaletteCard` pour rester homogène.

## Fichiers concernés

- `src/lib/ouvrageRecoKb.ts` (nouveau, socle expert)
- `src/components/propriete/palette/OuvragesRegister.tsx` (nouveau) + `OuvrageRecoCard.tsx`, `OuvrageRecoEditor.tsx`
- `src/hooks/propriete/useOuvrageRecoKb.ts` (nouveau : fusion socle ↔ base)
- `src/components/propriete/tabs/TabPalette.tsx` (renommage du chapitre 2, comptage, montage du registre)
- Migration : table `propriete_ouvrage_kb` + GRANT + RLS
