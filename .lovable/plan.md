## Diagnostic (vérifié dans le code)

- L'Atelier (`PaletteStudio.tsx`) est rendu dans un **portail plein écran en `z-[3000]`**, alors que le chatbot (`ChatBot.tsx`) vit en `z-[1200]`. Le bouton flottant « 🌿 IA de Jardin » et le panneau sont donc **physiquement recouverts** dès qu'on ouvre l'Atelier : d'où « je ne la vois pas ».
- Le mécanisme de cadrage existe déjà mais **n'est branché nulle part** : `openGardenAi({ objetId, radiusM, prefill })` (`proprieteChatFocus.ts`) n'a aucun appelant, et le contexte `ouvrage.focus` de `useProprieteChatProviders.ts` reste donc toujours vide.

## Mise en œuvre

### 1. Rendre l'IA visible au-dessus de l'Atelier
- Introduire un niveau de superposition dédié pour le chatbot lorsqu'un plein écran est actif : passer FAB, panneau et overlay du chatbot au-dessus de `z-[3000]` (ex. `z-[3200]/3190`) via un flag « surface plein écran ouverte » posé par `PaletteStudio` à son montage (petit store externe, même patron que `proprieteChatFocus`).
- Bénéfice transverse : la même bascule servira aux autres plein écran (Carte des révélations, Prélèvements).

### 2. Entrée « IA de Jardin » native dans l'Atelier
- Ajouter dans la barre haute de l'Atelier (à côté de *Inspirations* / *Nouvel emplacement*) un bouton **« 🌿 IA de Jardin »** au style forêt profonde + liseré or, cohérent avec la charte du diagnostic.
- Clic = `openGardenAi()` sans cadrage : l'IA s'ouvre avec la Console de contextes de la propriété.

### 3. Interroger un ouvrage sélectionné (le cœur de la demande)
Dans `ObjectInspector.tsx` (panneau droit de l'objet), ajouter un bloc **« Interroger l'IA sur cet ouvrage »** :
- Bouton principal **« Demander à l'IA de Jardin »** → `openGardenAi({ objetId: objet.id, radiusM })`, ce qui active automatiquement le contexte `ouvrage.focus` (nom, type, surface, calque, note de chantier, prélèvement rattaché, cortège dans le rayon).
- **Sélecteur de rayon d'écoute** (10 / 25 / 50 / 100 m) avec halo dessiné sur la carte pendant la sélection, pour visualiser ce que l'IA « entend » autour de l'ouvrage.
- **3–4 amorces contextuelles** générées selon le type d'ouvrage (Mare, Potager, Massif, Verger…), issues du KB `ouvrageRecoKb.ts` : ex. *« Quelle palette pour cette mare compte tenu du sol lu ? »*, *« Quelles espèces éviter ici ? »*, *« Quel calendrier de plantation ? »*. Chaque amorce pré-remplit le composer via `prefill`.

### 4. Contexte visible et modifiable dans la conversation
- Afficher en tête du chat un **bandeau de cadrage** : « 🎯 Ouvrage : *Massif couvert* · rayon 25 m », avec une croix pour revenir à la propriété entière et un raccourci vers la Console de contextes.
- Les contextes activés restent affichés en chips (déjà en place) : l'utilisateur voit exactement ce qui part au modèle, et la jauge éco se met à jour au changement de rayon.

### 5. Bonus discret sur la carte
- Sur la pastille d'un objet sélectionné, une petite action « 🌿 » ouvre directement l'IA cadrée sur cet ouvrage sans passer par l'inspecteur.

## Détails techniques
- Nouveau store minimal `fullscreenSurface` (ou extension de `proprieteChatFocus`) pour le z-index conditionnel — pas de changement d'architecture.
- Aucune modification de l'edge function `propriete-chat` : la frugalité (contextes activés uniquement) reste inchangée.
- Fichiers touchés : `PaletteStudio.tsx`, `ObjectInspector.tsx`, `ChatBot.tsx`, `DraggableFab.tsx` (z-index), `proprieteChatFocus.ts`, `useProprieteChatProviders.ts` (amorces par type).
