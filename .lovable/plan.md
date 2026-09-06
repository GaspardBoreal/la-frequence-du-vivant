# Faire ressortir l'entretien de Laurence Karki en premier

Objectif : quand on tape « Laurence Karki » sur Google, Bing ou dans une IA (ChatGPT, Perplexity, Gemini), la page de son entretien sur La Fréquence du Vivant arrive en tête.

## Le vrai blocage aujourd'hui

Le site est une application qui se construit dans le navigateur. La page de Laurence existe bien, mais le fichier envoyé au robot est une coquille vide : son nom, ses réponses, sa photo n'y sont pas. Google sait exécuter le code et finit par voir le contenu, avec du retard. Les robots des IA génératives, eux, ne l'exécutent pas : pour eux, la page est aujourd'hui **vide**. C'est la raison numéro un pour laquelle elle ne peut pas ressortir dans les réponses d'IA.

Deuxième point : le titre affiché dans les résultats est « Animer une communauté autour du vivant — Laurence Karki ». Pour une recherche sur un nom, le nom doit venir en premier.

Troisième point : « Laurence Karki » n'apparaît quasiment nulle part ailleurs sur le site, et la fiche d'identité de la page ne relie son nom à aucun autre profil public. Un moteur ne peut pas confirmer qu'il s'agit bien d'une même personne identifiable.

## Ce que je propose de faire

### 1. Rendre la page lisible sans navigateur (le geste décisif)

À la fabrication du site, générer une vraie page HTML complète pour chaque entretien : titre, chapô, photo, questions, réponses, fiche d'identité. Le visiteur ne verra aucune différence ; le robot, lui, recevra le texte immédiatement. C'est ce qui ouvre la porte aux IA génératives.

### 2. Mettre son nom devant

- Titre de résultat : « Laurence Karki — vice-présidente et ambassadrice de La Fréquence du Vivant ».
- Description : une phrase qui commence par « Laurence Karki, … » et dit qui elle est avant de dire ce qu'elle raconte.
- Titre visible en haut de page : ajouter son nom et sa fonction juste sous le titre de l'entretien, en toutes lettres.

### 3. Une page « Qui est Laurence Karki »

Créer une page dédiée à la personne (adresse du type `/personnes/laurence-karki`) : portrait, fonction, en deux paragraphes son rôle dans l'association, ses citations, la liste de ses marches et de ses contributions, puis un lien bien visible vers l'entretien complet. C'est le format que les moteurs et les IA préfèrent pour une recherche sur un nom : une page dont le sujet **est** la personne, pas un article où elle intervient.

### 4. Renforcer les signaux d'identité

- Compléter la fiche d'identité invisible de la page (celle que lisent les moteurs) avec ses liens publics : LinkedIn, profil iNaturalist, site personnel, page d'auteur — tout ce qu'elle accepte de rendre public. **J'ai besoin de ces liens de sa part** : sans eux, ce point reste incomplet.
- Ajouter son nom aux endroits du site où elle intervient déjà (page association, pages de marches auxquelles elle a participé, index des entretiens), avec à chaque fois un lien vers sa page.

### 5. Aider explicitement les IA

- Enrichir le fichier destiné aux IA (`llms.txt`) : une entrée dédiée à Laurence Karki avec ses citations exactes, pas seulement un résumé.
- Ajouter la page « personne » et une date de mise à jour fraîche au plan du site.

### 6. Ce qui ne dépend pas du site (mais qui pèse lourd)

Un moteur classe d'abord ce que d'autres confirment. Pour une recherche sur un nom, trois actions extérieures valent souvent plus que dix réglages techniques :

- Que Laurence mette le lien de son entretien dans son profil LinkedIn (section « À propos » ou publication épinglée).
- Une publication LinkedIn de l'association et une de Laurence, avec le lien.
- Le lien depuis les sites partenaires qui la mentionnent déjà, s'il y en a.

Ces gestes-là, je ne peux pas les faire à sa place — mais je peux préparer les textes.

## Ce qu'il faut savoir sur les délais

Une fois en ligne : Google met en général deux à six semaines pour reclasser une page sur un nom propre. Les IA génératives dépendent de leurs propres cycles de collecte, souvent plus lents encore. Si un homonyme plus visible existe, la première place demande les signaux extérieurs du point 6.

## Détail technique

- **Pré-rendu** : ajouter une étape de génération statique au build (plugin Vite de prerender ou script post-build) pour les routes `/entretiens`, `/entretiens/:slug` et `/personnes/:slug`. Les fichiers produits sont servis avant la réécriture `/(.*) → /index.html` de `vercel.json`, donc rien d'autre à changer côté hébergement. À valider : `curl` sur l'URL en production doit renvoyer le texte de l'entretien.
- `src/content/entretiens/index.ts` : `seoTitle` et `seoDescription` de `laurence-karki-animer-communaute-vivant` réécrits nom en tête ; `LAURENCE.sameAs` renseigné dès réception des liens.
- `src/pages/EntretienDetail.tsx` : nom + fonction rendus dans un sous-titre textuel sous le `<h1>` ; balisage `Person` enrichi (`sameAs`, `worksFor`, `knowsAbout` depuis `entities`, `alumniOf` si pertinent) ; ajouter un balisage `speakable` sur les citations.
- Nouvelle page `src/pages/PersonneDetail.tsx` + route `/personnes/:slug`, alimentée par les données `EntretienPerson` existantes (aucun doublon de contenu) ; balisage `ProfilePage` + `Person` avec `mainEntity`, canonical propre, et lien réciproque avec l'entretien.
- `public/sitemap.xml` : ajout de `/personnes/laurence-karki`, `lastmod` actualisé. `public/llms.txt` : entrée « personne » distincte de l'entrée « entretien ».
- Aucune URL publique existante n'est modifiée.

## Ce dont j'ai besoin de vous

1. Les liens publics de Laurence (LinkedIn, iNaturalist, autre) pour la fiche d'identité.
2. Son accord pour une page dédiée à son nom, avec sa photo en grand.
3. Confirmation que je peux ajouter son nom sur les pages de marches auxquelles elle a participé.
