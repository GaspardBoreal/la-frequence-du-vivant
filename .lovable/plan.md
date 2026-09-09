# Méga booster le référencement (Google + IA)

## Où vous en êtes vraiment (vérifié aujourd'hui)

- Le site est bien indexé par Google : page d'accueil « Soumise et indexée », dernier passage le 7 septembre, aucun blocage.
- Sur 28 jours : 45 clics, 161 impressions, position moyenne 3,6. Autrement dit, vous êtes très bien placé… sur très peu de requêtes. Le problème n'est pas le classement, c'est le **nombre de portes d'entrée**.
- Les seules requêtes remontées sont « la marche du vivant » et « gaspardboreal.com » : uniquement des recherches de marque. Personne n'arrive encore par un besoin (« analyser le sol de son jardin », « plantes bio-indicatrices »).
- Les contrôles techniques passent : robots, pages lisibles par les IA en version texte, pré-rendu pour les moteurs, langue et affichage mobile corrects.
- Les cinq pages Fréquence Jardin créées hier **ne sont pas encore en ligne** : elles n'existeront pour Google qu'après publication.
- Demande réelle en France (source Semrush) : « plante bio indicatrice » ~170 recherches/mois, difficulté faible ; « comment analyser le sol de son jardin » ~20/mois, difficulté quasi nulle. Petits volumes, mais très accessibles et parfaitement alignés avec votre contenu.

## Le plan, dans l'ordre d'impact

### 1. Publier, puis faire venir les robots (aujourd'hui)

Sans cette étape, tout le reste ne sert à rien.

- Publier l'application.
- Soumettre le plan du site dans Search Console et demander l'indexation des cinq pages Fréquence Jardin une par une.
- Créer le compte Bing Webmaster Tools et y soumettre le plan du site : Bing alimente ChatGPT et Copilot. C'est le levier le plus direct côté IA.

### 2. Corriger un point qui va vous coûter cher

Les boutons « Démarrer mon jardin » envoient maintenant vers `frequence-jardin.lovable.app`, un domaine séparé. Google traite cela comme un autre site : la notoriété que vous construisez sur `la-frequence-du-vivant.com` ne lui profite pas, et une IA qui cite la marque pourra renvoyer vers une adresse « lovable.app » peu crédible.

Trois options, à trancher (question posée ci-dessous) :
- brancher un sous-domaine `jardin.la-frequence-du-vivant.com` sur l'application (recommandé) ;
- garder l'adresse actuelle et empêcher son indexation, pour que seule la vitrine remonte ;
- ne rien changer et assumer deux adresses concurrentes.

### 3. Passer de 5 à 15 pages qui répondent à de vraies questions

Chaque page vise une question que les gens tapent réellement, et s'appuie uniquement sur les données déjà présentes dans le projet (méthodes de sol, base des plantes indicatrices, sources de palette, relevés de Deviat).

Vague 1 — sol :
- Comment analyser le sol de son jardin soi-même
- Test du boudin : connaître la texture de sa terre en 5 minutes
- Test de sédimentation au bocal
- Mesurer le pH de son sol sans laboratoire

Vague 2 — flore et plantes :
- Que veut dire l'ortie / le chiendent / le plantain dans mon jardin (une page par plante « signal », 4 à 6 pages)
- Tableau des plantes bio-indicatrices (page dédiée, la formulation la plus recherchée)

Chaque page : une réponse en tête, la méthode, un tableau, les limites, et un renvoi vers l'application.

### 4. Se rendre citable par les IA

- Un bloc de questions/réponses factuelles en fin de chaque page, formulé pour être recopié tel quel.
- Le fichier destiné aux IA mis à jour à chaque nouvelle page.
- Données structurées : article, fil d'Ariane, et une fiche « organisation » qui déclare Fréquence Jardin comme produit de l'association.
- Une page « À propos / la méthode » qui définit la marque en une phrase stable, reprise à l'identique partout.

### 5. Exister ailleurs que chez vous (le facteur décisif pour les IA)

Les IA citent ce que plusieurs sources indépendantes confirment. À faire de votre côté, je fournis les textes :
- fiche Wikidata de l'association mentionnant Fréquence Jardin ;
- page LinkedIn de l'association + publications qui pointent vers la vitrine ;
- 2 ou 3 articles hébergés ailleurs (PiloTerra, partenaires, presse locale, blogs jardin) nommant « Fréquence Jardin » ;
- annuaires : solutions écologiques, numérique responsable, sciences participatives.

### 6. Mesurer

Un point à 30 jours dans Search Console : nombre de pages indexées, requêtes hors marque, clics. On garde ce qui prend, on renforce ce qui stagne.

## Limite honnête à connaître

Les aperçus de lien sur les réseaux sociaux restent aujourd'hui ceux du site entier : les titres par page sont posés côté navigateur. Google et les IA les voient, pas Facebook ou LinkedIn. Une version rendue côté serveur lèverait cette limite — [ce que l'upgrade apporte](https://lovable.dev/blog/building-apps-using-tanstack-start).

## Détails techniques

- Nouvelles pages sous `src/pages/FrequenceJardin*.tsx`, contenu factuel centralisé dans `src/content/frequenceJardin/`, mise en page via `FjKit` (métadonnées, fil d'Ariane, données structurées, canoniques auto-référencées).
- Routes déclarées avant `/jardin/:slug` dans `src/App.tsx`.
- Mise à jour systématique de `public/sitemap.xml`, `public/llms.txt` et de la table `site_pages` (univers `jardin`) à chaque page ajoutée.
- Aucun chiffre inventé : toutes les valeurs proviennent de `etudeDeSolMethodes.ts`, `plantIndicatorKb.ts`, `paletteSources.ts` et du carnet de Deviat.

## Ce que je ferai à l'approbation

Les étapes 3 et 4 (les 10 nouvelles pages et les signaux de citabilité), plus la correction retenue à l'étape 2. Les étapes 1, 5 et le suivi vous reviennent — je fournis les textes et la marche à suivre.
