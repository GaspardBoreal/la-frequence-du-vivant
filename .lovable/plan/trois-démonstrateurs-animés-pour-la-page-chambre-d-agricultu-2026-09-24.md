# Trois démonstrateurs animés pour la page Chambre d'agriculture

Page concernée : /partenaires/chambre-agriculture-pays-de-la-loire. Trois visuels vivants, un par chantier, placés juste après « En synthèse ». Aucun changement aux textes, aux verticaux ni au formulaire.

## 1. REGULAR : la haie qui chasse la nuit
- Paysage nocturne en coupe : verger ou maraîchage, haie bocagère, lune.
- Des chauves-souris suivent le corridor de la haie. Des ondes d'écoute (ultrasons) partent d'un détecteur, et les ravageurs (carpocapse, noctuelle) disparaissent un à un.
- Compteur animé : contacts par nuit, ravageurs régulés, baisse estimée des traitements (valeurs d'illustration, signalées comme telles).
- Curseur « Température nocturne / vent » : l'activité de chasse monte ou baisse, comme avec une station WEENAT.

## 2. Agriculture de conservation : le sol éponge
- Coupe de sol en deux moitiés : sol nu à gauche, sol sous couvert permanent à droite.
- Une pluie tombe. L'eau s'infiltre lentement et se retient à droite, ruisselle à gauche.
- Sondes BRAD à 15, 30 et 60 cm : jauges d'humidité qui montent en direct pour chaque côté.
- Bouton « Faire pleuvoir » pour relancer la démonstration.

## 3. Pollinisateurs et invasives : la fenêtre de butinage
- Carte de parcelle stylisée avec haies fleuries. Des pollinisateurs circulent entre les massifs.
- Frise d'une journée : les heures favorables (plus de 12 °C, vent faible) s'éclairent, et l'activité suit.
- Des taches d'espèces invasives (Renouée, Ambroisie, Baccharis) clignotent en alerte, puis passent « traitées ».

## Règles communes
- Palette existante de la page (crème, émeraude, ambre, terre) ; formes fines et élégantes, jamais caricaturales.
- Démarrage quand le visuel entre à l'écran ; mouvement réduit respecté (image fixe complète).
- Export PDF : chaque visuel figé dans son état le plus parlant, lisible sur papier.
- Chiffres présentés comme exemples, jamais comme mesures réelles.

## Détails techniques
- Nouveaux composants dans `src/components/partenaires/chambre-agri/` : `RegularNightDemo.tsx`, `SoilSpongeDemo.tsx`, `PollinatorWindowDemo.tsx`, en SVG + framer-motion (déjà installé), déclenchés via `useRevealOnScroll`.
- Intégration dans `src/pages/PartenaireChambreAgriPdl.tsx` dans une nouvelle section « Voir la plateforme à l'œuvre », `break-inside-avoid`.
- Styles d'impression : animations neutralisées, état final affiché.
- Vérification : tsgo, puis capture Playwright à l'écran et en mode impression.
