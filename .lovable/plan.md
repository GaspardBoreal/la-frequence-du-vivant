# Panorama interactif des outils de mesure — IA frugale

Une page publique où le visiteur manipule quatre mini-simulateurs, un par outil
(CodeCarbon, EcoLogits, Green Algorithms, Compar:IA), voit les résultats bouger
en direct, et lit d'où vient chaque chiffre.

**URL proposée : `/ia-frugale/outils-de-mesure`**
(dites-moi si vous préférez une autre adresse, elle est libre à ce stade)

## Principe de rigueur

Rien n'est inventé. Chaque simulateur applique la formule publiée par l'outil
lui-même, avec ses coefficients d'origine, et chaque carte affiche :

- la formule utilisée, écrite en clair ;
- les constantes employées avec leur source et sa date de consultation ;
- le lien vers la page de méthode officielle ;
- une mention honnête des limites (marges d'incertitude, ce que le modèle ne
  couvre pas).

Quand une valeur n'est pas publiée par la source, elle n'est pas affichée : le
curseur correspondant est absent plutôt qu'estimé au jugé.

## Les quatre exercices

**1. CodeCarbon — « Votre script tourne, combien ça coûte ? »**
Curseurs : durée d'exécution, type de matériel (CPU/GPU parmi la liste de
puissances publiée), taux d'utilisation, pays (facteur carbone du réseau).
Résultat animé : watt-heures et grammes de CO2e, plus deux équivalents concrets
(km en voiture thermique, temps d'ampoule LED). Bouton « et si je déplaçais ce
calcul en France / en Pologne ? » qui rejoue la même mesure avec un autre mix
électrique. Encart : les cinq lignes de code réelles à ajouter à un notebook.

**2. EcoLogits — « Une réponse d'IA générative, ça pèse quoi ? »**
Curseurs : nombre de paramètres actifs du modèle, nombre de jetons produits,
mix électrique du pays d'hébergement. Le calcul suit la formule publiée par
EcoLogits, vérifiée sur leur page de méthode : impact d'une requête = énergie
consommée × facteur carbone du mix + part de fabrication du matériel amortie sur
la durée de la requête, avec leur modèle d'énergie par jeton produit
(coefficients alpha, beta, gamma publiés, taille de lot fixée à 64). Deux
compteurs supplémentaires : impact « fabrication » distinct de l'impact
« usage », et comparaison instantanée petit modèle contre grand modèle sur la
même question.

**3. Green Algorithms — « Décider avant de lancer »**
Curseurs : nombre de cœurs, nombre de cartes graphiques, durée, pays,
efficacité du centre de données (PUE), facteur d'usage réel du matériel. Sortie :
empreinte a priori, plus le « facteur de gâchis » — combien on économise en
réservant juste ce qu'il faut. Petit défi : atteindre une cible d'empreinte en
ajustant les curseurs, façon jeu.

**4. Compar:IA — « Le même prompt, deux modèles »**
Choix d'une tâche parmi quelques exemples et de deux modèles ; affichage côte à
côte des impacts respectifs et du rapport entre les deux, dans l'esprit du
service public français. Conçu pour être projeté en réunion : gros chiffres,
une phrase de conclusion. Un lien invite à refaire l'expérience en vrai sur
comparia.beta.gouv.fr avec de vraies réponses de modèles.

## Mise en page

En-tête reprenant l'esprit de votre planche « Module 4 Outillage » : titre fort,
sous-titre, quatre cartes à filet coloré, chacune avec son étiquette de nature
(package Python, calculateur web, comparateur public) et sa phrase « l'outil
pour… ». Mobile d'abord : curseurs larges, résultats collants en bas d'écran
pendant qu'on fait varier. Pied de page « également utiles » avec ML CO2 Impact,
AI Energy Score et Awesome Green AI, comme sur votre planche.

## Détail technique

- Nouvelle page `src/pages/IaFrugaleOutils.tsx`, route publique déclarée dans
  `src/App.tsx`, chargée en `lazyWithRetry` comme les autres pages publiques.
- Données et formules isolées dans `src/content/iaFrugale/outilsMesure.ts` :
  constantes sourcées (facteurs carbone par pays, TDP matériels, coefficients
  EcoLogits), fonctions de calcul pures, et pour chaque constante un champ
  `source` + `consulteLe` affiché dans l'interface.
- Quatre composants sous `src/components/ia-frugale/` (un par simulateur) plus
  un `SourceNote` commun.
- Tokens sémantiques du thème existant, aucune couleur en dur ; compteurs
  animés via le composant `AnimatedCounter` déjà présent.
- `SEOHead` pour titre, description, canonical, plus JSON-LD `LearningResource`.
- Entrées ajoutées dans `public/sitemap.xml` et `public/llms.txt`.

### Sourcing à faire avant d'écrire les formules

La formule EcoLogits est déjà relevée sur leur page de méthode. Restent à
relever, à la source, avant tout codage : la méthode CodeCarbon (table des
puissances matérielles et facteurs carbone), la formule et les coefficients du
calculateur Green Algorithms, et la méthode d'impact affichée par Compar:IA.
Si une de ces méthodes n'est pas publiquement documentée, la carte concernée
renvoie vers l'outil sans inventer de calcul, et le dit explicitement.

## Vérification

Page ouverte en navigateur à 375 px et 1280 px, en thème clair et sombre ;
contrôle que chaque curseur fait bouger les résultats de façon cohérente et que
chaque chiffre affiché est rattaché à sa source.
