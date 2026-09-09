# Fiche propriété admin : Intention lisible, exportable, et tableau de bord

Trois ajouts à la fiche `/admin/proprietes/:id`, dans le style existant (sections ancrées, sommaire, en-tête fixe).

## 1. Section « Portrait · Intention »

Nouvelle section `sec-intention` (après Localisation), qui montre exactement ce que le jardinier voit dans Mon projet › Portrait › Intention, en deux volets repris tels quels :

- **Le jardin** — phrase de portrait, carte « Le jardin qui vous ressemble » (vignette, titre, mots-clés), profil détecté, puis les réponses des chapitres Vous / Votre lieu / Vos envies / Vos moyens.
- **Le projet** — le problème à résoudre, l'objectif à six mois, les premiers gestes.

L'admin peut corriger chaque réponse : un crayon par carte rouvre l'écran de question plein écran déjà utilisé côté jardinier (`IntentionQuestionEditor`), enregistrement par la même RPC protégée. Aucune divergence de rendu entre les deux endroits : le composant est partagé, pas dupliqué.

Un bandeau indique clairement le cas « parcours d'accueil jamais fait » avec le nombre de réponses renseignées (n / N).

## 2. Export de l'intention (cette propriété)

Un menu **Exporter** en tête de la section, trois formats :

- **CSV** — une ligne par question : chapitre, question, réponse lisible, réponse brute, date.
- **JSON** — le contenu intégral et fidèle de l'intention (réponses, persona, jardin-exemple, gestes, portrait, version et dates du parcours), sans perte.
- **PDF** — document mis en page, sobre et lisible : en-tête avec le nom du jardin, la commune et la date, puis les deux volets « Le jardin » et « Le projet », vignette du jardin-exemple incluse. Généré côté navigateur, dans l'esprit du carnet de terrain existant.

Nom de fichier : `intention-<slug-du-jardin>-AAAA-MM-JJ.<ext>`.

## 3. Tableau de bord de la propriété

Nouvelle section `sec-tableau-de-bord`, placée en tête de la fiche : une grille de cartes, une par module, chacune cliquable vers le module concerné dans l'espace jardinier.

| Carte | Ce qu'elle montre |
|---|---|
| Observations | nombre de relevés, dernière date, espèces distinctes |
| Analyse (sol) | nombre de diagnostics, date du dernier, zones couvertes |
| Identification (flore) | diagnostics flore, dernière date |
| Palette végétale | nombre d'espèces retenues |
| Atelier du jardin | objets suivis, photos associées |
| Tour de jardin | tours réalisés, dernier tour, envois du carnet |
| Clinique du jardin | consultations, dont ouvertes, dernière date |
| Capteurs et sondes | sondes actives, dernière mesure reçue |

Chaque carte a le même squelette : pictogramme, chiffre principal en grand, une ligne de contexte (« dernier relevé il y a 3 jours »), et un état vide encourageant quand le module n'a jamais servi (« Aucun tour encore — commencer »). Une ligne de tête résume la vitalité du jardin : modules actifs sur huit, et date de la dernière activité toutes sources confondues.

Soin visuel : cartes en grille responsive (1 colonne mobile, 2 puis 4 en large), jetons de couleur par famille de module tirés des tokens existants, apparition en cascade légère, aucun chiffre inventé — un module sans donnée affiche son état vide, jamais un zéro trompeur.

## Détails techniques

- `src/pages/AdminProprieteFiche.tsx` : deux entrées ajoutées à `SECTIONS` (`sec-tableau-de-bord`, `sec-intention`), rendues seulement hors création (`editOnly`).
- Réutilisation directe de `PortraitIntention.tsx` (+ `GardenExampleCard`, `IntentionQuestionEditor`, `usePropertyIntention`, `useSaveIntention`, `useCanEditIntention`) ; le sélecteur de volet passe d'un paramètre d'URL à une prop optionnelle pour ne pas entrer en conflit avec le hash de section de la fiche.
- Nouveau `src/lib/intentionExport.ts` : aplatissement questions → lignes, sérialisation CSV/JSON, et rendu PDF (jsPDF, comme les exports existants).
- Nouveau `src/components/admin/proprietes/fiche/ProprieteDashboard.tsx` + `useProprieteDashboard.ts` : une requête groupée en `head: true, count: 'exact'` par table (`propriete_observations`, `propriete_soil_diagnostics`, `propriete_flora_diagnostics`, `propriete_palette`, `propriete_objets`, `propriete_tours`, `propriete_consultations`, `iot_capteurs` + `iot_mesures`) filtrées sur `propriete_id`, plus la dernière date par module. Lecture seule, aucune écriture.
- Aucune migration : les compteurs s'appuient sur les tables et RLS existantes. Si une lecture admin est bloquée par RLS sur l'une d'elles, elle sera repliée sur une RPC de comptage dédiée plutôt qu'une ouverture de table.
- Aucune URL publique modifiée.
