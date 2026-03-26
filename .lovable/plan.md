

# Grille de fonctionnalites progressives — Web App "Les Marches du Vivant"

Synthese croisee du protocole de marche, du dossier partenaires v1.2 et de l'application existante.

---

## Architecture par role

Chaque role debloque des capacites supplementaires sur les trois volets (Biodiversite, Bioacoustique, Geopoetique). Le principe : **effet wahou immediat, zero friction**.

---

### 1. MARCHEUR — "Premier pas, premier emerveillement"

| Fonctionnalite | Volet | Description |
|---|---|---|
| **S'inscrire a des marches** | Transversal | Inscription en 1 clic depuis Mon Espace (existe deja) |
| **Carnet de terrain personnel** | Biodiversite | Apres chaque marche, le marcheur retrouve son carnet : photos, especes observees, carte du parcours — genere automatiquement par l'IA a partir des donnees collectees |
| **Mon premier sonogramme** | Bioacoustique | Pendant la marche, enregistre un son (oiseau, insecte, riviere). L'IA identifie l'espece et genere un sonogramme visuel colore que le marcheur peut partager comme une "carte postale sonore" |
| **Kigo du jour** | Geopoetique | A la fin de chaque marche, le marcheur choisit son mot de saison (kigo). L'IA lui propose un haiku genere a partir de son kigo + les especes observees. Il peut l'editer, le garder, le partager |
| **Partage social natif** | Transversal | Chaque marche a une URL unique partageable. Bouton "Inviter un ami" qui genere un lien personnalise avec le prenom du marcheur ("Rejoins [Prenom] pour la prochaine marche !") |
| **Quiz "Eveil sensoriel"** | Pedagogique | Apres l'Accordage, quiz interactif de 5 questions visuelles (photos d'especes locales, sons a reconnaitre, kigo a associer). Gagne des Frequences bonus |

**Idees wahhhh supplementaires :**
- **"Ma Frequence du jour"** : un score poetique quotidien — combinaison du nombre d'especes vues + sons captes + mots ecrits — affiche comme une onde sonore animee dans Mon Espace
- **"Graine plantee"** : apres validation de la marche, le marcheur photographie sa graine plantee. La photo apparait sur une carte collaborative des graines plantees par tous les marcheurs

---

### 2. ECLAIREUR — "Explorateur des territoires inconnus"

| Fonctionnalite | Volet | Description |
|---|---|---|
| **5 zones blanches explorees** | Biodiversite | Badge debloque automatiquement. Visualisation de ses zones explorees sur une carte personnelle avec gradient de couleurs |
| **Comparateur de marches** | Biodiversite | Interface split-screen pour comparer biodiversite, sons et textes entre 2+ marches. "Qu'est-ce qui change entre la Dordogne en aout et en mars ?" |
| **Bibliotheque sonore personnelle** | Bioacoustique | Collection de tous ses enregistrements avec spectrogrammes, classement par espece/saison/lieu. Peut creer des "playlists du vivant" |
| **Atelier haibun** | Geopoetique | Deblocage de la forme longue (haibun = prose + haiku). L'IA aide a tisser les observations scientifiques dans un recit poetique |
| **Quiz "Eclaireur"** | Pedagogique | Quiz avance : identification sonore d'oiseaux (extraits Xeno-Canto), reconnaissance de zones ecologiques, association kigo-saison. 10 questions, chronometre |

**Idees wahhhh supplementaires :**
- **"Defi Silence"** : l'eclaireur est invite a explorer une zone "Silence" (0 observation). S'il y decouvre une espece, il la "revele" — animation spectaculaire dans l'app + notification a tous les marcheurs du secteur
- **"Duo poetique"** : l'IA propose un exercice collaboratif — 2 eclaireurs de marches differentes echangent leurs kigos et doivent ecrire un haiku croise. Le resultat est publie dans la galerie communautaire

---

### 3. AMBASSADEUR — "Animateur et createur d'experiences"

| Fonctionnalite | Volet | Description |
|---|---|---|
| **Creation de marches** | Transversal | Interface guidee : choisir un lieu (carte + detecteur zones blanches), definir le parcours, inviter des marcheurs. L'IA genere automatiquement la fiche pedagogique (sequences de 15 min selon le protocole) |
| **Creation d'explorations** | Transversal | Regroupement de plusieurs marches en exploration thematique (ex: "Frequences de la riviere Dordogne"). Vue timeline, parties/mouvements |
| **Synthese biodiversite post-marche** | Biodiversite | Dashboard automatique genere apres chaque marche : especes identifiees, comparaison avec le GBIF, zones blanches comblees, graphiques de diversite |
| **Studio bioacoustique** | Bioacoustique | Outil de montage leger pour assembler les meilleurs enregistrements d'une marche en un "portrait sonore du territoire" de 3 minutes |
| **Guide geopoetique** | Geopoetique | L'ambassadeur recoit un kit d'animation : exemples de kigos par saison, exercices de haiku adaptes au public (enfants, seniors, entreprises), fiches imprimables |
| **Quiz "Formateur"** | Pedagogique | Quiz de certification : 20 questions sur les 3 piliers. Reussir debloque le droit d'animer des marches labellisees |

**Idees wahhhh supplementaires :**
- **"Recit de marche"** : a la fin de chaque marche animee, l'IA genere un recit immersif complet (texte + photos + sons + carte) publiable en un clic comme "Carnet de Terrain" sur le site
- **"Tableau vivant"** : visualisation temps reel pendant la marche — projection possible sur un ecran mobile — montrant les especes detectees par le groupe en direct, avec spectrogrammes et kigos collectifs

---

### 4. SENTINELLE — "Gardien de territoire, formateur de formateurs"

| Fonctionnalite | Volet | Description |
|---|---|---|
| **Creation de territoires** | Transversal | Regroupement d'explorations en "Territoire" (ex: "Vallee de la Dordogne"). Vue meta avec indicateurs de biodiversite agreges, evolution temporelle |
| **Referent territorial** | Biodiversite | Acces a un dashboard territorial : evolution des especes sur son territoire annee apres annee, alertes sur especes invasives ou en declin |
| **Archives sonores territoriales** | Bioacoustique | Conservateur d'une banque de sons du territoire. Peut taguer, annoter, publier des collections thematiques (ex: "Chants d'aube en Dordogne") |
| **Anthologie geopoetique** | Geopoetique | Curation des meilleurs textes des marcheurs de son territoire. Publication d'anthologies numeriques (type mini-recueil) |
| **Quiz "Sentinelle"** | Pedagogique | Parcours de formation avance : modules video + quiz sur la formation d'ambassadeurs, protocoles scientifiques, animation de groupes |

**Idees wahhhh supplementaires :**
- **"Memoire du territoire"** : timeline interactive montrant l'evolution d'un territoire sur plusieurs annees — superposition des donnees biodiversite, sons et textes. Un "film" du vivant sur son territoire
- **"Mentorat"** : la sentinelle peut parrainer un marcheur. Notifications mutuelles, progression partagee, echange de kigos. Un lien humain inscrit dans l'app

---

### 5. ADMINISTRATEUR — "Pilotage global"

| Fonctionnalite | Volet | Description |
|---|---|---|
| **Peut tout faire** | Transversal | Acces total : gestion des profils, evenements, validations, formations, certifications (existe deja via CommunityProfilesAdmin + MarcheEventsAdmin) |
| **Dashboard partenaires** | Transversal | Vue dediee pour chaque partenaire : impact sur leurs zones, metriques CSRD, export PDF |
| **Defis territoriaux** | Transversal | Creation et pilotage de defis orientes par les partenaires (zones prioritaires, multiplicateurs de Frequences) |
| **Quiz builder** | Pedagogique | Creation de quiz personnalises par niveau, par saison, par territoire |

**Idees wahhhh supplementaires :**
- **"Pulse du vivant"** : dashboard temps reel montrant toutes les marches en cours en France, avec flux de donnees live (especes, sons, textes). La "salle de controle" du vivant
- **"Export impact"** : generation automatique de rapports d'impact par partenaire (PDF brande) avec metriques verifiables pour le reporting CSRD/RSE

---

## Contraintes transversales respectees

| Contrainte | Solution |
|---|---|
| **Partage d'URLs** | Chaque marche/exploration/territoire a une URL unique. Bouton "Inviter" avec message personnalise. Incitation via Frequences bonus |
| **Multi-marcheurs par marche** | Deja supporte (marche_participations). Ajouter une vue "Qui participe ?" visible par les inscrits |
| **IA collaborative** | L'IA du vivant propose des exercices croises entre marcheurs (haiku croise, defi duo, comparaisons). Jamais prescriptive, toujours suggestive |
| **Supports pedagogiques** | Quiz visuels interactifs a chaque niveau (5 → 10 → 20 questions), adaptes au volet concerne, avec feedback immediat et gain de Frequences |
| **3 volets equilibres** | Chaque role a au minimum 1 fonctionnalite dediee par volet (Biodiversite, Bioacoustique, Geopoetique) |

---

## Implementation technique

Les fonctionnalites existantes (inscription, profils, participations, ProgressionCard, detecteur zones blanches, carnets de terrain, Guide de Marche IA) constituent le socle. Les ajouts principaux :

- **Nouvelles tables Supabase** : `quiz_questions`, `quiz_responses`, `sound_recordings`, `kigo_entries`, `territories`, `exploration_groups`
- **Edge Functions** : generation de carnets post-marche, identification sonore, generation haiku IA
- **Composants React** : `QuizInteractif`, `CartePostaleSonore`, `KigoDuJour`, `ComparateurMarches`, `DashboardTerritorial`
- **Partage** : Web Share API (deja en place) + liens personnalises avec metadata OpenGraph dynamiques

Cette grille est progressive : chaque niveau s'appuie sur les acquis du precedent, sans jamais submerger le nouvel arrivant.

