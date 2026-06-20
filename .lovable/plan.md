# Refonte hero ISEGCOM Bordeaux

## Scope strict
Seul le hero de `src/pages/IsegcomBordeaux.tsx` est modifié. Onglets, galerie, sections Formation / Expérience Biodiv / Pourquoi nous, SEO, route, data : **aucun changement**.

## Nouvelle direction artistique
Split éditorial 7/5 sur fond **papier crème `#fdfbf7`** :

**Colonne gauche (7/12)**
- Chip discret bordé `border-[#0d6b58]/10`, pastille dorée, label `ISEGCOM Bordeaux × Les Marches du Vivant`
- Titre `Crimson Pro` 5xl→8xl, vert profond `#0d6b58`, italique doré souligné sur `prompt-e`
- Sous-titre MBA en `text-[#0d6b58]/70`
- Bloc citation à filet doré gauche `border-l-4 border-[#c9a961] bg-[#0d6b58]/5` : phrase formation + Laurent Tripied
- Rangée CTA arrondi vert + 3 stats serif (13 / 02 / 01) séparées par un filet vertical fin

**Colonne droite (5/12)**
- Photo unique (Eleves_et_professeur_01) en `aspect-[3/4] rounded-[1.5rem] shadow-2xl`
- Cadre doré décalé `-inset-4 border border-[#c9a961]/20 -rotate-1`
- Gradient bas vert + bloc citation glassmorphism : *« L'impact réel naît de la rencontre entre l'IA et l'engagement collectif. »*
- Halos flous décoratifs (or + vert)

## Détails techniques
- Garder Crimson Pro déjà chargé via Tailwind (`font-crimson`), pas de nouveau font à installer
- Conserver le contenu textuel existant (titre, sous-titre, phrase, 3 stats, CTA "Découvrir les 13 projets" scrollant vers `#galerie`)
- Couleurs hex en dur acceptées ici car prototype validé (palette Forest Emerald spécifique à cette page)
- Animation Ken Burns douce sur la photo + fade-in titre via `animate-fade-in`
- Mobile : stack vertical, photo en premier ou sous le bloc texte selon lisibilité

## Fichier touché
- `src/pages/IsegcomBordeaux.tsx` — uniquement le bloc hero (du `<section>` du haut jusqu'à la fin du hero, avant le bloc tabs)
