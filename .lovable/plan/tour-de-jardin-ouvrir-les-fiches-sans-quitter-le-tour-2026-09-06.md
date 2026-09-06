# Tour de Jardin : ouvrir les fiches sans quitter le tour

Aujourd'hui, quand une action cite le syrphe ceinturé, la carotte D ou une zone du plan, le texte reste inerte. On doit sortir du Tour pour aller vérifier, et on perd le fil de la sortie.

## Ce que l'utilisateur verra

Dans le détail d'une action, les éléments reconnus deviennent des mots cliquables, discrètement soulignés, avec une petite icône :

- une espèce (feuille) — « syrphe ceinturé (*Episyrphus balteatus*) »
- un prélèvement de sol (carotte) — « secteur D », « prélèvement B »
- un secteur du plan (polygone) — le nom exact de la zone dessinée
- un ouvrage ou une sonde (outil / capteur) — nom de l'objet ou du capteur du lieu

Un appui ouvre un **panneau qui monte du bas**, par-dessus le tour, refermable d'un geste vers le bas, par la croix ou avec Échap. Le tour reste exactement où il était derrière, aucune navigation, aucune perte de position de lecture.

Contenu du panneau, court et illustré, mobile first :

- **Espèce** : photo, nom français en grand, nom latin en italique, pastille « Déjà observée ici » quand elle est dans les observations du lieu (avec le nombre d'observations et la date la plus récente), une phrase de rôle écologique quand on la connaît, et un lien iNaturalist en pied de panneau.
- **Prélèvement** : la fiche carotte existante, telle qu'elle s'ouvre déjà depuis la carte des prélèvements (structure, texture, pH, vie du sol, photos).
- **Secteur** : nom, couleur, surface, note, et la forme de la zone dessinée en miniature.
- **Ouvrage / sonde** : nom, photo si elle existe, état, dernières mesures pour une sonde.

Chaque panneau se termine par un bouton « Ouvrir la fiche complète » pour ceux qui veulent aller plus loin — le clic quitte alors volontairement le tour.

Quand une action mobilise plusieurs ressources, une ligne de petites puces sous le texte n'est pas ajoutée : on garde la lecture propre, les liens vivent dans la phrase.

## Fiabilité de la reconnaissance

Deux niveaux, combinés :

1. **L'IA renseigne les liens** pour les tours générés à partir de maintenant : chaque action peut porter une liste de références explicites (type + identifiant + libellé exact tel qu'il apparaît dans la phrase).
2. **Détection automatique du texte** pour tout le reste, y compris les tours déjà écrits de DEVIAT et Maison sous Blossac : les noms latins entre parenthèses ou en italique, les mentions « secteur X / prélèvement X / carotte X » quand la lettre existe dans le registre du lieu, et les noms de zones, ouvrages et sondes de la propriété repérés au mot près.

La détection ne s'applique qu'à des éléments qui existent réellement dans les données de la propriété — jamais de lien mort. En cas de doute (libellé trop court, mot ambigu de moins de 4 lettres), rien n'est transformé : le texte reste tel quel.

## Détails techniques

**Base**
- Migration : `alter table public.propriete_tour_actions add column refs jsonb not null default '[]'::jsonb`. Forme d'un élément : `{ kind: 'species'|'sample'|'zone'|'objet'|'capteur', id?: string, latin?: string, label: string }` (`label` = texte exact à rendre cliquable). Pas de changement de RLS ni de GRANT.

**Edge `propriete-tour-suggest`**
- Ajout de `refs` au schéma de l'outil `return_tour` (tableau optionnel par action), avec dans le prompt la liste des identifiants réellement disponibles (labels de carottes, noms de zones, objets, capteurs) pour que l'IA ne cite que l'existant. Écriture de `refs` à l'insertion des actions.

**Front — nouveau dossier `src/components/propriete/tour/refs/`**
- `useTourRefIndex.ts` : agrège en une fois pour la propriété les sources déjà disponibles — `usePropertySpeciesPool`, `usePropertySoil` (readOnly, samples A/B/C…), `useProprieteZones`, `usePropertyObjets`, capteurs du lieu (`useIotTelemetry` / requête capteurs par propriété). Retourne un index normalisé (NFD, minuscules) et un matcher.
- `linkifyTourText.tsx` : transforme `titre` + `detail` en segments React. Ordre : `refs` explicites d'abord, puis détection (latin en parenthèses/italique → espèce ; `secteur|prélèvement|carotte + lettre` → carotte ; correspondance exacte de nom pour zone/objet/capteur). Rendu Markdown minimal déjà présent (gras, italique) conservé.
- `TourRefSheet.tsx` : panneau bas via `Sheet` shadcn (`side="bottom"`, `rounded-t-2xl`, poignée, `max-h-[85vh]`, contenu défilant), pilotées par un store léger façon `sampleDrawerStore` (`openTourRef(ref)` / `closeTourRef()`), monté une fois dans `TabTour`.
- Sous-panneaux : `RefSpeciesPanel` (réutilise `SpeciesThumb`, `SpeciesName`, `speciesLatinBase`, `useSpeciesThumb`, et le pool pour la présence sur site), `RefSamplePanel` (délègue à `openSampleCore` du store existant), `RefZonePanel` (nom, surface, note, miniature SVG de la géométrie), `RefObjetPanel` / `RefCapteurPanel`.

**Intégration**
- `TourActionRow.tsx` : remplace l'affichage brut de `action.titre` / `action.detail` par le rendu linkifié (uniquement hors mode édition, pour ne pas gêner la saisie). `refs` ajouté au type `TourAction` dans `useProprieteTours.ts` et propagé dans `updateAction`.
- Tokens sémantiques uniquement, styles au clavier accessibles (`focus-visible`), cibles tactiles ≥ 40 px, `prefers-reduced-motion` respecté par le `Sheet`.
