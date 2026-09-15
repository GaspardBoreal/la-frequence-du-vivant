# Innovation Robot : une feuille de route frugale, vérifiable et actionnable

## Ligne directrice

Créer une page publique `/innovation-robot` qui ne présente pas une galerie futuriste, mais un **outil d’aide à la décision** pour trois publics : propriétaires de jardins, propriétaires/coops viticoles et partenaires financeurs.

La conclusion éditoriale sera claire dès le premier écran :

> Ne pas commencer par un humanoïde. Commencer par mieux mesurer avec des capteurs légers, déplacer ces capteurs avec un petit porteur réparable, puis louer ou mutualiser les machines lourdes uniquement quand le gain est démontré.

La page distinguera systématiquement : **disponible maintenant**, **prototype à tester**, **recherche à surveiller** et **hors cible**. Aucun prix, gain ou niveau de maturité ne sera présenté sans source ; les montants non publics seront indiqués « sur devis ».

## Ce que la page démontrera à partir du document fourni

Un chapitre « Ce que le dossier ouvre — et ce qu’il ne résout pas » reprendra des verbatims courts, avec la page du PDF et la source primaire associée :

- LeRobot propose des « outils communs permettant à la communauté de partager données, modèles et méthodes d’entraînement » : pertinent comme socle logiciel et format de données, pas comme robot de jardin prêt à l’emploi.
- LeRobot Humanoid revient à « environ 2 500 dollars en composants » mais Hugging Face le décrit comme une plateforme expérimentale d’apprentissage ; il ne résiste ni à la pluie, ni à la boue, ni aux contraintes d’un chantier paysager.
- Microduck, « vendu 399 dollars », est un banc d’apprentissage mobile de 25 cm ; utile pour la médiation et le prototypage, pas pour mesurer ou travailler une parcelle.
- OpenPI est pré-entraîné sur « plus de 10 000 heures de données robotiques », mais demande encore un matériel graphique puissant et une adaptation au robot cible.
- Genie Sim ouvre « plus de 10 000 heures de données synthétiques » sur plus de 200 tâches et 100 000 scénarios : utile pour tester avant de casser, pas une preuve de robustesse dans un jardin réel.
- Asimov publie plans, simulation et nomenclature ; ses 1,20 m, 35 kg, 25 articulations et son objectif de coût autour de 15 000 dollars le placent dans la R&D, pas dans le premier investissement frugal.

Le document sera traité comme **source secondaire datée**. Les faits importants seront recoupés avec les pages officielles de NVIDIA, Hugging Face/Pollen Robotics, Menlo Research, Physical Intelligence et AgiBot. Tnkr ne sera cité que comme élément du document tant qu’une source primaire correspondant bien à la plateforme robotique n’est pas retrouvée.

## Navigation et sous-menus

Un bandeau secondaire collant, utilisable au pouce, donnera accès à :

1. **La thèse** — pourquoi « capteur d’abord, robot ensuite ».
2. **Mesurer** — biodiversité et sol.
3. **Agir** — jardin et vignoble.
4. **Choisir** — comparateur interactif des solutions.
5. **Budgets** — trois paliers chiffrés.
6. **Plan d’action** — 90 jours, 6 mois, 12 mois.
7. **Preuves & sources** — bibliographie, verbatims, limites et date de vérification.

Au-dessus de ce menu, un sélecteur **Jardin | Marche du Vivant | Vignoble | Partenaire** adaptera les recommandations, les indicateurs de réussite et les appels à l’action sans dupliquer la page.

## Les trois parcours d’usage

### 1. Jardins : mesurer avant d’automatiser

**Mesure biodiversité**
- Station bioacoustique ouverte AudioMoth/BirdNET pour oiseaux et chauves-souris.
- Piège photo ou caméra basse consommation sur des points fixes.
- Photographie géolocalisée déjà compatible avec Fréquence Jardin/iNaturalist.
- eDNA ponctuel sous-traité lorsque la question justifie le coût ; jamais présenté comme remplaçant l’observation naturaliste.

**Mesure du sol**
- Humidité et température capacitives durables, puis conductivité ; pH connecté uniquement avec protocole d’étalonnage et contrôle terrain.
- Conservation des tests existants de la « Carotte de sol » comme référence interprétable.
- Aucun capteur NPK grand public utilisé pour une décision de fertilisation engageante sans analyse de laboratoire.

**Action**
- Premier prototype : chariot instrumenté poussé ou tracté, non autonome, portant caméra, micro, GPS et sondes.
- Automatisation ensuite limitée aux tâches répétitives et réversibles : arrosage ciblé, inspection, transport léger, tonte sélective hors zones refuges.
- FarmBot sera présenté comme démonstrateur de culture sur planche fixe, à 5 995–7 995 dollars, donc pertinent pour expérimentation/éducation mais rarement le meilleur premier achat d’un jardin.

### 2. Marches du Vivant : un « sac à dos robotique » avant le rover

- Kit de marche standardisé : smartphone/GNSS, AudioMoth, caméra, sondes portatives et protocole d’échantillonnage.
- Chariot léger à assistance manuelle pour répéter les mesures aux waypoints, sans autonomie dangereuse au milieu des marcheurs.
- Enregistrement automatique de la position, de l’heure, du capteur, de la calibration et de la personne ayant validé la mesure.
- Rover autonome seulement sur un parcours fermé, sans public, après comparaison avec le protocole humain.
- Les vols de drone resteront une option de cartographie/prestation : cadre DGAC, vue directe, zones autorisées, vie privée et absence de survol de rassemblement.

### 3. Vignobles : mutualiser les machines, acheter les petits capteurs

- Acheter les stations de mesure et la bioacoustique ; louer les drones et robots lourds.
- Vitirover sera étudié comme petit robot solaire léger autour de 10 000 € pour l’entretien de l’enherbement, avec validation préalable des zones refuges et du risque pour la petite faune.
- Les robots lourds de désherbage/travail du sol (Ted, Bakus, YV01, Zilus, etc.) seront présentés « sur devis » ou avec fourchette sourcée, et recommandés en prestation/CUMA plutôt qu’en achat isolé.
- La pulvérisation par drone sera strictement séparée de la cartographie : en France, les traitements restent encadrés et limités aux cas prévus par les textes de 2026.
- Chaque action robotisée sera reliée à un objectif propriétaire : réduire l’herbicide, diminuer le tassement, préserver les refuges, économiser l’eau, détecter plus tôt ou sécuriser une pente.

## Comparateur réellement utile

Une matrice interactive permettra de filtrer les solutions par :

- contexte : jardin, marche, vignoble ;
- fonction : observer, prélever, cartographier, transporter, arroser, tondre/désherber ;
- budget : moins de 3 000 €, 3 000–10 000 €, 10 000–30 000 €, plus de 30 000 € ;
- maturité : commercial, pilote, recherche ;
- décision : **acheter**, **fabriquer**, **louer/mutualiser**, **surveiller**, **écarter**.

Chaque fiche affichera coût vérifié, maturité, énergie, réparabilité, terrain compatible, donnée produite, intégration possible avec Fréquence Jardin/Marches, contraintes, source et date de vérification. Un bloc « Pourquoi ce choix ? » expliquera la recommandation sans jargon commercial.

## Budgets par paliers

### Palier 1 — prouver la valeur, moins de 3 000 €

- Deux kits terrain biodiversité/sol interchangeables.
- Bioacoustique, humidité/température, conductivité, pH contrôlé, caméra et géolocalisation.
- Un chariot manuel instrumenté et réparable.
- Protocole témoin humain contre mesure instrumentée.

**Décision de passage :** gain de temps, répétabilité, qualité des données et adoption terrain mesurés sur au moins deux jardins et deux marches.

### Palier 2 — prototype mobile, 3 000 à 10 000 €

- Motoriser le chariot à basse vitesse, avec téléopération, arrêt d’urgence et reprise manuelle.
- Tester un seul module d’action réversible : transport, arrosage ciblé ou inspection.
- Simuler les trajectoires avant terrain ; ne pas entraîner un modèle généraliste coûteux si une règle déterministe suffit.

**Décision de passage :** aucun incident, bénéfice net documenté et coût par mission inférieur au protocole précédent.

### Palier 3 — déploiement mutualisé, 10 000 à 30 000 € puis prestation

- Pilote Vitirover ou équivalent sur un vignoble/jardin adapté.
- Drone opéré par un prestataire autorisé pour la cartographie.
- Robot lourd uniquement par CUMA, coopérative, location ou démonstration fournisseur.

**Décision d’achat :** seulement après une saison complète et calcul du coût total : acquisition, assurance, formation, supervision, maintenance, pièces, transport et indisponibilité.

## Plan d’action 90 jours / 6 mois / 12 mois

**0–90 jours**
- Écrire trois protocoles minimaux : biodiversité, sol, action.
- Acheter le palier 1, instrumenter deux jardins pilotes, une marche et un vignoble.
- Définir cinq indicateurs communs : temps terrain, coût/point, taux de données valides, espèces/données supplémentaires, intervention évitée ou mieux ciblée.
- Constituer un registre des calibrations, pannes et faux positifs.

**3–6 mois**
- Comparer humain seul / capteurs / chariot instrumenté.
- Construire le petit porteur uniquement si le déplacement des capteurs est le vrai goulot d’étranglement.
- Publier un premier jeu de données documenté et les limites observées.
- Lancer un essai en prestation d’une solution viticole légère.

**6–12 mois**
- Motorisation supervisée sur site fermé.
- Intégration des mesures validées dans la base de connaissance du jardin et dans les carnets de marche.
- Bilan économique et écologique par usage.
- Décision acheter/louer/arrêter, puis dossier de financement uniquement pour les solutions ayant franchi les seuils.

## Présentation visuelle — au moins cinq images distinctes

Créer une série cohérente de **six visuels originaux**, clairement présentés comme des visions d’usage et non comme des photographies de produits existants :

1. vue d’ouverture : petit porteur discret dans un jardin vivant, humain au premier plan ;
2. station bioacoustique fixée en lisière, avec lecture visuelle des sons ;
3. chariot instrumenté pendant une Marche du Vivant, protocole collectif visible ;
4. gros plan d’une carotte de sol et des sondes, couches et points de mesure lisibles ;
5. robot solaire léger entre les rangs d’un vignoble, zones refuges explicitement préservées ;
6. atelier ouvert : pièces réparables, nomenclature, outils et simulation avant terrain.

Les légendes préciseront toujours « illustration de principe ». Les produits réels seront décrits dans les fiches avec liens officiels, sans reproduire leurs photographies commerciales. Une frise animée « Observer → Comprendre → Décider → Agir → Vérifier » et une matrice coût/maturité compléteront ces images.

## Style et expérience

Direction visuelle : **laboratoire de terrain vivant** — photographie immersive, papier crème, forêt profonde, vert capteur et accent or, avec repères techniques fins inspirés des carnets naturalistes. Aucun décor futuriste générique, humanoïde spectaculaire ou tableau de bord froid.

- Premier écran immersif avec le vrai sujet immédiatement visible : un humain augmenté par un petit outil de terrain.
- Sous-menu collant, filtres tactiles et comparateur lisible sur mobile.
- Sections pleine largeur, sans empilement de cartes dans des cartes.
- Animations sobres : parcours d’un relevé, mise en relation capteur → preuve → action, respect de la réduction des mouvements.
- Parcours financeur plus quantifié ; parcours propriétaire plus concret ; parcours coopérative centré mutualisation et sécurité.

## Sources et rigueur

La bibliographie visible regroupera :

- le PDF fourni, cité par page et accompagné de ses verbatims ;
- sources officielles NVIDIA/Hugging Face/Pollen, Menlo Research, Physical Intelligence et AgiBot pour les solutions du document ;
- INRAE CIDEA, ORICA, NINSAR et CANNOPHY pour les capteurs enterrés, sols déformables, flottes simples et phénotypage de la vigne ;
- ROMI pour le rover de microferme ouvert ;
- Open Acoustic Devices/AudioMoth, BirdNET et Biomonitor4CAP pour la mesure de biodiversité ;
- ministère de la Transition écologique/DGAC et ministère de l’Agriculture pour les drones ;
- pages fabricant officielles pour caractéristiques et prix, avec date de consultation.

Les promesses constructeur seront marquées comme telles. Les preuves scientifiques, retours d’usage et contraintes réglementaires auront un statut visuel distinct. Une note expliquera que robotiser une mesure ne la rend pas automatiquement exacte : calibration, protocole, témoin humain et validation restent obligatoires.

## Intégration au site

- Nouvelle route publique `/innovation-robot`, chargée à la demande.
- Bandeau public unifié, recherche globale et pied de page des Marches du Vivant.
- Contenu structuré dans un fichier de données typé pour faciliter l’ajout futur de solutions, coûts et sources sans refaire la page.
- Ajout au catalogue de recherche sous « La Fréquence du Vivant », avec mots-clés jardin, vignoble, marches, robotique frugale, capteurs, biodiversité et sol.
- Ajout au sitemap et à `llms.txt` ; métadonnées, canonical, fil d’Ariane et JSON-LD `TechArticle` + `ItemList` des solutions.
- Liens internes depuis Fréquence Jardin, Marches et agriculture, page d’IA frugale et page de référence sur l’étude de sol.
- Aucune base métier supplémentaire : la première version est une page publique de décision, pas un catalogue administrable.

## Vérifications finales

- Vérifier chaque prix et affirmation au moment de publier ; supprimer toute donnée impossible à corroborer.
- Tester les quatre parcours et tous les filtres sur mobile, tablette et ordinateur.
- Contrôler contrastes, textes longs, sous-menu collant, clavier, mouvement réduit et absence de débordement.
- Vérifier que les six visuels sont nets, cohérents, correctement légendés et ne peuvent pas être confondus avec des produits commercialisés.
- Tester tous les liens de source, la route, la recherche globale et les données structurées.
