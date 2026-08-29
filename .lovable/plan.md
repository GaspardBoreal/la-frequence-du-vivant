# Le jardin-exemple et « Quel jardin vous fait rêver ? » : un seul et même choix

## Constat vérifié

Deux réponses parlent de la même chose, mais vivent séparément :

- la carte **« Le jardin qui vous ressemble »** (jardin-exemple choisi dans la galerie) ;
- la question **Vos envies › « Quel jardin vous fait rêver ? »** (clé `style`), dont les 7 valeurs sont `nourricier`, `verger_prairie`, `ville_bacs`, `beaute`, `mixte`, `aquatique`, `structure`.

Vérification en base : les types de la galerie (`onboarding_garden_types.slug`) portent **exactement ces mêmes 7 identifiants** (`nourricier` → « Jardin nourricier », `aquatique` → « Jardin d'eau », etc.). La correspondance est donc directe, sans table de traduction à inventer.

Aujourd'hui, choisir une image n'écrit pas `style`, et répondre à la question ne touche pas l'image : l'écran affiche « À compléter » alors qu'un jardin-exemple est déjà retenu. Par ailleurs l'image de la carte n'est pas cliquable — on ne peut pas la voir en grand.

## Ce qui sera fait

### 1. Choisir une image renseigne « Quel jardin vous fait rêver ? »

À l'enregistrement d'un jardin-exemple depuis la galerie, la réponse `style` est écrite dans le même geste, à partir du type du jardin choisi. Le type est aussi mémorisé dans le bloc du jardin-exemple pour rester relisible. « Aucun ne me ressemble » n'efface pas la réponse `style` déjà donnée.

### 2. Répondre à la question propose l'image correspondante

Après avoir répondu à « Quel jardin vous fait rêver ? », si le jardin-exemple retenu n'appartient pas au style choisi (ou si aucun n'est retenu), la galerie s'ouvre aussitôt, **pré-filtrée sur ce style**, avec un mot d'explication : « Vous rêvez d'un jardin nourricier — voici les jardins de cette famille. » L'utilisateur peut fermer sans choisir : la réponse reste enregistrée, rien n'est écrasé.

### 3. Cohérence visible à l'écran

- La carte « Le jardin qui vous ressemble » affiche le style associé (badge du type).
- La vignette de la question « Quel jardin vous fait rêver ? » affiche le libellé du style ; elle ne restera plus vide quand l'image seule a été choisie.

### 4. Voir la photo en grand

L'image de la carte devient cliquable et ouvre une visionneuse plein écran (image entière, légende, description, source), fermable au clic, à la croix ou par Échap. Dans la galerie de choix, un appui long / une loupe sur chaque vignette ouvre la même visionneuse sans valider la sélection — on peut regarder avant de choisir. Mobile d'abord : image plein écran, légende en surimpression.

## Détails techniques

- `src/components/propriete/portrait/GardenExamplePicker.tsx` : `commit()` envoie aussi la réponse `style` (slug du type de l'exemple) ; nouvelle prop `initialTypeSlug` pour l'ouverture pré-filtrée ; loupe par vignette ouvrant la visionneuse.
- `src/hooks/propriete/usePropertyIntention.ts` : `useSaveGardenExample` accepte un patch de réponses joint (fusion dans `answers` via la même RPC `save_propriete_onboarding`) ; `StoredGardenExample` gagne `typeId` / `typeSlug`.
- `src/components/propriete/portrait/PortraitIntention.tsx` : après enregistrement de la question `style`, ouverture conditionnelle du picker pré-filtré.
- `src/components/propriete/portrait/GardenExampleCard.tsx` : badge du style + image cliquable.
- Réutilisation de `src/components/onboarding/GardenExampleViewer.tsx` (visionneuse plein écran déjà écrite, navigation clavier incluse) plutôt qu'une nouvelle lightbox.
- Aucune migration : tout tient dans `onboarding_preferences` et la RPC existante.
