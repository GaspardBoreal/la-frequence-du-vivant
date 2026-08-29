# « Le projet » — décroiser les cartes et faire rédiger les gestes par l'IA

## Constat vérifié

Sur le jardin « Les Hortensias » (`onboarding_preferences`, version 5) :

- `priorite = resoudre_probleme`, `priorite_probleme = « Ma haie, plantée il y a plusieurs années, ne grandit pas en hauteur »`, `objectif_6_mois = structurer`.
- Les trois `gestures` stockés datent du parcours d'accueil (17:15) : bocal, diagnostic de haie, couverture du sol. Ils n'ont pas bougé après les modifications faites ensuite dans LFDV (19:49). Ils sont **figés à la volée OFJ** : LFDV ne les recalcule jamais.

Le croisement vient du découpage actuel :

- la **question** « Quelle est votre priorité ? » (dont « Résoudre un problème » est une option) est affichée dans le sous-onglet **Le jardin**, chapitre « Vos envies » ;
- son **complément texte libre** (`priorite_probleme`) est, lui, affiché seul dans **Le projet**, sous le titre « Le problème à résoudre ».

Résultat : la priorité et sa précision sont séparées dans deux sous-onglets, et si la priorité passe à autre chose que « Résoudre un problème », l'ancien texte reste affiché comme si de rien n'était.

## Ce qui sera fait

### 1. Décroiser les deux cartes

- La question `priorite` quitte le chapitre « Vos envies » du sous-onglet **Le jardin** : elle ne vit plus qu'ici, dans **Le projet**.
- La carte « Le problème à résoudre » devient la carte **priorité** complète : libellé de la priorité choisie en tête (ex. « Résoudre un problème sur le site »), puis le texte libre cité mot pour mot quand il existe. Le crayon ouvre la même question qu'aujourd'hui.
- Cohérence : quand la nouvelle priorité n'est plus « Résoudre un problème », le texte libre associé n'est plus affiché (et n'est plus transmis à l'IA) ; il reste conservé en base pour ne rien perdre si l'utilisateur revient en arrière.
- La carte « Les six prochains mois » ne change pas.

Ordre final du sous-onglet Le projet : Votre priorité → Les six prochains mois → Vos premiers gestes.

### 2. Les trois gestes rédigés par l'IA de jardin

Les gestes deviennent une lecture de l'intention à jour, pas une photo du jour de l'inscription.

- Nouvelle fonction serveur qui rédige exactement trois gestes à partir de l'intention courante : priorité et problème, cap à six mois, persona, style de jardin, surfaces, contraintes, temps disponible, exposition, irrigation, et jardin-exemple retenu.
- Chaque geste garde la forme actuelle (titre court, explication en une ou deux phrases) pour ne rien casser à l'affichage, et se voit attribuer un croquis pris dans le vocabulaire existant.
- Déclenchement : automatique et silencieux dès qu'une réponse du projet ou du jardin change (une empreinte des réponses est enregistrée à côté des gestes ; si l'empreinte diffère, on régénère). Bouton « Régénérer mes gestes » visible pour le propriétaire, et mention discrète « rédigés le … ».
- Pendant la rédaction : trois cartes en attente (squelettes), jamais d'écran vide. En cas d'échec, les gestes précédents restent affichés avec un message court et le bouton pour réessayer.
- Les gestes rédigés sont enregistrés dans `onboarding_preferences.gestures` : l'IA de jardin, la clinique et la synthèse continuent de lire la même source.

## Détails techniques

- `src/config/onboarding/defaultSequence.ts` : `priorite` passe au chapitre « Le projet » (ou est exclue du rendu des chapitres dans `PortraitIntention`, selon le moindre impact sur le parcours d'accueil — l'ordre des questions du parcours reste identique).
- `src/components/propriete/portrait/PortraitIntention.tsx` : la carte priorité affiche `readableAnswer(priorite, …)` + le texte libre conditionné à `priorite === 'resoudre_probleme'` ; filtrage de `priorite` dans la boucle des chapitres du sous-onglet Le jardin.
- Nouvelle edge function `generate-garden-gestures` : lit l'intention via la RPC sécurisée existante, appelle la passerelle IA Lovable (`google/gemini-3.7-flash`) en sortie JSON stricte (3 objets `{ title, detail, sketch }`), puis écrit via `save_propriete_onboarding` avec `{ gestures, gestures_meta: { generated_at, fingerprint, source: 'ia_jardin' } }`. Gestion des statuts 429/402 conforme au contrat de la passerelle (message explicite, pas de boucle de relance).
- Nouveau hook `useGardenGestures(proprieteId)` : calcule l'empreinte des réponses, déclenche la génération si elle diverge, expose `isGenerating` / `regenerate`, met à jour le cache React Query avec le JSON renvoyé.
- `src/hooks/propriete/useProprieteChatProviders.ts` : le contexte IA reçoit la priorité lisible, le problème (seulement s'il est pertinent) et les gestes à jour.
- Aucune migration de schéma : tout tient dans `onboarding_preferences`. Aucune URL publique touchée.
