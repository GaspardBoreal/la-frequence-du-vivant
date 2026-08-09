# La Clinique du jardin — médecin préventif et curatif

Nouvelle entrée **« La Clinique »** dans le menu **Mon projet**, à côté de Palette végétale et Atelier du jardin. Elle transforme une inquiétude floue (« mes groseilliers ont quelque chose ») en un diagnostic argumenté, un plan de soin écologique et un journal de terrain horodaté.

## Le parcours en quatre temps

```text
  CONSULTATION        DIAGNOSTIC          ORDONNANCE          SUIVI
  photo + 3 questions  hypotheses IA      gestes ecologiques  journal horodate
  espece iNaturalist   croisees sol/meteo  du plus doux au +   photos/videos/voix
                       niveau de confiance  fort               courbe de guerison
```

### 1. La consultation
Bouton « Ouvrir une consultation ». On choisit le sujet malade : soit une espèce déjà connue du site (pool iNaturalist / observations marcheurs, avec sa vignette), soit un végétal cultivé saisi à la main (groseillier, marronnier, cerisier). On photographie l'organe touché (feuille, fruit, écorce, collet), on peut ajouter une vidéo ou un vocal. Trois questions guidées maximum : organe concerné, aspect dominant (taches, poudre blanche, dessèchement, galeries, déformation), et depuis quand.

### 2. Le diagnostic croisé
L'IA de Jardin lit la photo puis pose 2 à 3 questions ciblées pour lever le doute, et rend **trois hypothèses classées** avec un niveau de confiance, jamais une certitude unique. Chaque hypothèse s'affiche en carte : nom courant + nom scientifique du pathogène ou ravageur, ce qui se voit, ce qui se confond avec, la gravité réelle pour la plante.

Le disruptif est là : l'hypothèse est **confrontée au terrain réel de la propriété**, pas jugée dans le vide. Un bandeau « Ce que dit votre sol » relie chaque hypothèse aux données déjà présentes :
- registre de sol (structure, texture, pH, signes de vie, prélèvement le plus proche géographiquement de la plante malade) ;
- les quatre curseurs eau / texture / nutrition / pH de la concordance sol-flore ;
- la météo des 30 derniers jours (pluie cumulée, humidité, amplitude thermique) déjà disponible via Open-Meteo ;
- plus tard, la sonde.

Exemple rendu à l'écran : « Oïdium probable (confiance moyenne). Votre sol est tassé et le curseur Eau penche vers l'excès ; 8 jours d'humidité > 85 % en juin. Le terrain confirme l'hypothèse. » Ou l'inverse : « Le terrain contredit partiellement cette piste. »

### 3. L'ordonnance vivante
Un plan d'action en gestes ordonnés **du plus doux au plus fort** : observer, tailler/aérer, favoriser les auxiliaires, purins et décoctions, et seulement en dernier recours les produits autorisés en agriculture biologique. Chaque geste porte une fenêtre de réalisation (dates), une fréquence, un rappel météo (« ne pas traiter sous pluie ou plein soleil ») et une case à cocher. Deux volets séparés : **curatif** (maintenant) et **préventif** (l'an prochain : rotation, taille d'aération, espèce compagne, paillage). Le volet préventif propose directement des espèces issues de la Palette végétale recommandée quand elles sont pertinentes.

### 4. Le journal de guérison
Chaque consultation garde son fil chronologique : photos, vidéos, vocaux, notes, gestes réalisés — tous horodatés, GPS conservé quand la photo le porte. Un curseur avant/après compare la première photo à la dernière. Une courbe simple « sévérité perçue » (notée 0-5 à chaque visite) montre si ça s'améliore. Statuts : en observation, en traitement, guéri, perdu.

## Les idées wahouhh en plus

- **Le baromètre de risque** — en tête de la Clinique, un indicateur quotidien croisant météo passée/prévue et espèces sensibles présentes sur le site : « Risque mildiou élevé cette semaine — 3 sujets exposés ». On anticipe au lieu de constater.
- **Le calendrier des vigilances** — une roue de l'année qui, pour chaque espèce du site, marque les périodes critiques connues (débourrement, floraison, chaleur) et les gestes préventifs à ne pas rater.
- **La carte de santé** — les consultations apparaissent en pastilles colorées sur le cadastre existant, ce qui révèle les foyers : « toutes les taches sont dans la zone basse et humide ».
- **La contagion probable** — quand un pathogène connu touche plusieurs hôtes, la Clinique signale les autres sujets du site à surveiller.
- **Le compte rendu de visite** — un PDF A4 dans la même écriture graphique que les dossiers existants : sujet, hypothèses, terrain, ordonnance, photos avant/après. Utile pour un pépiniériste ou un partenaire.
- **Le droit au doute** — quand la confiance est faible, la Clinique le dit et propose un protocole d'observation à 7 jours plutôt qu'un traitement hasardeux. Jamais de faux diagnostic assuré.

## Liens avec les entrées existantes

- **J'observe** — un sujet signalé souffrant depuis l'observation du site ouvre une consultation.
- **J'analyse (sol)** — lecture seule, source de vérité du terrain via le registre de prélèvements ; le prélèvement le plus proche est cité dans le diagnostic. Aucune écriture, le triple verrou reste intact.
- **J'identifie** — les quatre curseurs et l'ICG alimentent l'argumentaire ; une maladie récurrente est lue comme un signal d'inadéquation espèce/milieu.
- **Palette végétale** — le volet préventif puise dans les recommandations (compagnonnage, remplacement d'un sujet chroniquement malade).
- **Atelier du jardin / Chantier** — un remplacement décidé en Clinique devient un ouvrage ; un chantier terminé peut être suivi côté santé.
- **IA de Jardin** — la Clinique devient un contexte activable dans la Console de contexte et le Bordereau du vivant, comme les autres blocs.

## Détails techniques

Nouvelles tables (schéma `public`, avec GRANT explicites, RLS calquée sur `can_access_propriete`) :
- `propriete_consultations` — propriété, sujet (espèce du pool ou nom libre), position GPS optionnelle, statut, sévérité, dates.
- `propriete_consultation_hypotheses` — hypothèses IA, confiance, argumentaire terrain, hypothèse retenue.
- `propriete_consultation_actions` — gestes, volet curatif/préventif, fenêtre, fréquence, fait/non fait.
- `propriete_consultation_medias` — photos/vidéos/vocaux horodatés, réutilisant le pipeline `uploadWithMetadata` (EXIF, HEIC, rollback storage).
- `propriete_sensor_readings` — sonde : capteur, type de mesure, valeur, unité, horodatage, source (`manuelle`, `csv`, `api`). Saisie manuelle et import CSV dès maintenant, API plus tard sans migration.
- Base de connaissance `garden_pathogens_kb` — pathogènes/ravageurs courants, hôtes, signes, confusions, gestes écologiques ; enrichie par curation comme `species_eco_tags_kb`.

Edge functions : `diagnose-garden-disease` (vision multimodale + questions de levée de doute + croisement sol/météo, via l'AI Gateway) et `garden-risk-forecast` (baromètre quotidien).

Front : `src/components/propriete/clinique/` (ConsultationDrawer, HypothesisCards, TerrainCrossCheck, Ordonnance, JournalTimeline, RisqueBarometre, CalendrierVigilances), hooks dans `src/hooks/propriete/`, entrée `clinique` dans `ProprieteEspace.tsx` et pastilles sur `RichMap`. Tokens sémantiques uniquement, micro-animations Motion, vocabulaire « Fréquences » et « Observations », impression A4 dans le style des dossiers existants.

## Découpage proposé

1. Socle : tables, RLS, entrée de navigation, ouverture/liste des consultations, journal horodaté avec médias.
2. Diagnostic : edge function vision + questions, trois hypothèses, croisement sol/météo.
3. Ordonnance : gestes écologiques, curatif/préventif, suivi et courbe de guérison.
4. Anticipation : baromètre de risque, calendrier des vigilances, carte de santé, PDF de visite, sondes (saisie manuelle + CSV).
