# Panorama interactif des outils de mesure — cours IA frugale

Une page publique où le visiteur manipule **huit** mini-simulateurs : deux par
outil (CodeCarbon, EcoLogits, Green Algorithms, Compar:IA). Pour chaque outil,
un exercice ancré dans le cas **Les Marches du Vivant** et un exercice ancré
dans le cas **Propriété — Fréquence Jardin**.

**URL proposée : `/ia-frugale/outils-de-mesure`**

## Principe de rigueur

Rien n'est inventé. Chaque simulateur applique la formule publiée par l'outil
lui-même, avec ses coefficients d'origine. Chaque exercice affiche :

- la formule employée, écrite en clair, avec ses unités ;
- chaque constante utilisée, sa valeur, sa source et la date de consultation ;
- le lien vers la page de méthode officielle ;
- les limites explicites (incertitudes, ce que le modèle ne couvre pas).

Quand une valeur n'est pas publiée par la source, elle n'est pas affichée : le
curseur correspondant est absent plutôt qu'estimé au jugé. Les volumes propres à
vos deux cas (nombre d'observations, de photos, de fiches espèces) sont saisis
par le visiteur avec des valeurs de départ que vous pourrez ajuster : ce sont
des hypothèses affichées comme telles, jamais présentées comme des mesures.

## Les huit exercices

### CodeCarbon — mesurer un traitement qui tourne

1. **Marches du Vivant — « La nuit où l'on rattrape iNaturalist »**
   Curseurs : nombre d'observations à synchroniser, durée du traitement, type de
   machine, pays d'hébergement. Sortie : watt-heures et grammes de CO2e, plus
   « combien pour une marche », « combien pour une saison ».
2. **Fréquence Jardin — « Reconnaître les espèces sur photo »**
   Curseurs : nombre de photos, matériel (processeur seul ou carte graphique),
   durée par image, taux d'utilisation. Sortie animée + comparaison
   « traitement au fil de l'eau » contre « traitement groupé la nuit ».

### EcoLogits — mesurer un appel à un modèle génératif

3. **Marches du Vivant — « Le résumé éditorial d'une marche »**
   Curseurs : taille du modèle (paramètres actifs), longueur de la réponse
   produite, mix électrique du pays. Deux compteurs séparés : impact d'usage et
   impact de fabrication du matériel, comme le prévoit la méthode EcoLogits.
4. **Fréquence Jardin — « L'IA de Jardin, mille conversations »**
   Curseurs : nombre d'échanges par mois, longueur moyenne des réponses, choix
   entre un petit et un grand modèle. Sortie : impact mensuel et écart entre les
   deux modèles pour un service rendu identique.

*Base : la formule publiée par EcoLogits, relevée sur leur page de méthode —
impact d'une requête = énergie consommée × facteur carbone du mix + part de
fabrication amortie sur la durée de la requête, avec leur modèle d'énergie par
jeton produit (coefficients alpha, beta, gamma publiés, taille de lot 64).*

### Green Algorithms — décider avant de lancer

5. **Marches du Vivant — « Recalculer tous les instantanés de biodiversité »**
   Curseurs : cœurs, durée, pays, efficacité du centre de données (PUE), facteur
   d'usage réel. Sortie : empreinte a priori et « facteur de gâchis » —
   l'économie réalisée en réservant juste ce qu'il faut.
6. **Fréquence Jardin — « Un rapport de chantier, à quel prix ? »**
   Même moteur, appliqué à la génération des rapports avant/après d'une
   propriété. Petit défi chronométré : atteindre une cible d'empreinte en
   ajustant les curseurs.

### Compar:IA — convaincre un interlocuteur non technique

7. **Marches du Vivant — « Le même texte, deux modèles »**
   Deux modèles côte à côte sur la rédaction d'un carnet de terrain : impacts
   respectifs, rapport entre les deux, une phrase de conclusion en gros.
8. **Fréquence Jardin — « Le bon modèle pour la bonne question »**
   Trois tâches types du jardin (question courte, synthèse de tour, palette
   végétale) ; le visiteur choisit un modèle par tâche et voit l'empreinte
   cumulée du mois selon ses choix. Lien pour refaire l'expérience en vrai sur
   comparia.beta.gouv.fr.

## Mise en page

Esprit de votre planche « Module 4 Outillage » : titre fort, sous-titre en
italique, quatre blocs à filet coloré (violet foncé, violet, sarcelle, orange),
étiquette de nature (package Python, calculateur web, comparateur public) et
phrase « l'outil pour… ». Sous chaque bloc, les deux exercices en onglets
« Marches du Vivant » / « Fréquence Jardin ». Mobile d'abord : curseurs larges,
bandeau de résultats collant en bas d'écran pendant la manipulation. Pied de
page « également utiles » : ML CO2 Impact, AI Energy Score, Awesome Green AI.

## Détail technique

- Page `src/pages/IaFrugaleOutils.tsx`, route publique dans `src/App.tsx` en
  `lazyWithRetry` comme les autres pages publiques.
- `src/content/iaFrugale/outilsMesure.ts` : constantes sourcées (facteurs
  carbone par pays, puissances matérielles, coefficients EcoLogits), fonctions
  de calcul pures, et pour chaque constante un champ `source` + `consulteLe`
  affiché dans l'interface.
- `src/content/iaFrugale/casUsage.ts` : les huit scénarios (libellés, curseurs,
  valeurs de départ, texte pédagogique), séparés du moteur de calcul.
- Composants sous `src/components/ia-frugale/` : un `SimulateurCard` générique
  piloté par la description du scénario, un `SourceNote`, un `FormuleBloc`.
- Tokens sémantiques du thème existant, aucune couleur en dur ; compteurs animés
  via `AnimatedCounter` déjà présent.
- `SEOHead` (titre, description, canonical) + JSON-LD `LearningResource` ;
  entrées ajoutées dans `public/sitemap.xml` et `public/llms.txt`.

### Sourcing à faire avant d'écrire les formules

La formule EcoLogits est déjà relevée à la source. Restent à relever avant tout
codage : la méthode CodeCarbon (puissances matérielles, facteurs carbone), la
formule et les coefficients du calculateur Green Algorithms, et la méthode
d'impact affichée par Compar:IA. Si l'une n'est pas publiquement documentée, la
carte renvoie vers l'outil sans inventer de calcul, et le dit explicitement.

## Vérification

Page ouverte à 375 px et 1280 px, thèmes clair et sombre ; contrôle que chaque
curseur fait bouger les résultats de façon cohérente et que chaque chiffre
affiché est rattaché à sa source.
