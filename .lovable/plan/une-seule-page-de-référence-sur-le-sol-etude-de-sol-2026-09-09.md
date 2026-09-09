# Une seule page de référence sur le sol : /etude-de-sol

Vous avez tranché : `/etude-de-sol` reste LA page sur le diagnostic de sol. Les pages créées hier sur le même sujet sont retirées pour ne pas se concurrencer entre elles dans Google.

## Ce qui disparaît

Quatre adresses créées hier, qui répétaient les mêmes méthodes :

- « Comment analyser le sol de son jardin soi-même »
- « Test du boudin »
- « Test de sédimentation au bocal »
- « Mesurer le pH de son sol »

Quiconque arrive sur ces adresses (lien partagé, résultat Google encore en cache) est envoyé automatiquement vers `/etude-de-sol`. Aucune page d'erreur, aucun lien cassé.

## Ce qui reste inchangé

- `/etude-de-sol` : la page complète, 12 méthodes, cas concret Jardin Monde DEVIAT.
- Les 5 fiches de plantes (ortie, rumex, petite oseille, joncs, plantain) : sujet différent, aucune concurrence.
- Le tableau des plantes bio-indicatrices et « la méthode Fréquence Jardin » : sujets propres, conservés.
- La page pilier `/frequence-jardin` et ses 4 satellites.

## Ce que /etude-de-sol récupère au passage

Pour ne rien perdre du travail fait :

- Un bloc de questions/réponses courtes en bas de page (« Comment connaître la texture de sa terre ? », « Comment mesurer le pH sans laboratoire ? »…), formulé pour être repris tel quel par Google et par les IA.
- Les données structurées correspondantes (FAQ), qui manquaient à la page.
- Un renvoi vers Fréquence Jardin et vers le tableau des plantes bio-indicatrices.

## Détails techniques

- Suppression des 4 guides sol dans `src/content/frequenceJardin/guides.ts` (les deux autres guides restent) ; `FrequenceJardinArticle.tsx` et la route dynamique sont conservés pour les pages restantes.
- Redirections 301 des 4 anciennes adresses vers `/etude-de-sol` dans `public/_redirects` et `vercel.json` (avant la règle catch-all).
- Retrait des 4 URLs de `public/sitemap.xml`, de `public/llms.txt` et de la table `site_pages`.
- Nettoyage des liens internes vers ces pages dans `FrequenceJardinPilier.tsx` et dans les fiches de plantes.
- Ajout d'un bloc FAQ + JSON-LD `FAQPage` dans `EtudeDeSolPublique.tsx`, alimenté par `PUBLIC_METHODS` (aucun chiffre nouveau).
