
Objectif : corriger le fait que “Copier le lien” et “Partager” produisent aujourd’hui le même lien brut, puis transformer ces deux actions en un vrai dispositif d’invitation communautaire + partage public inspirant + tracking d’affiliation.

Constat confirmé dans le code
- Dans `src/components/community/exploration/MarcheursTab.tsx`, `handleShare()` et `handleCopyLink()` utilisent tous deux `window.location.href`.
- Résultat : les deux boutons renvoient exactement la même URL de l’espace connecté.
- Il n’existe aujourd’hui aucun système de referral/affiliation dédié, ni landing publique spécifique, ni tracking des liens générés/consultés par marcheur.
- La page exploration actuelle `/marches-du-vivant/mon-espace/exploration/:explorationId` est une page d’espace connecté, pas une vraie page publique de conversion.

Décisions déjà clarifiées
- “Partager” doit produire un Kit partage.
- La conversion affiliée à mesurer = “Compte créé”.
- Le lien partagé doit ouvrir une page publique dédiée.
- Il faut distinguer :
  1. clics sur boutons
  2. liens trackés générés

Plan d’implémentation

1. Corriger immédiatement la logique des 2 boutons
- `Copier le lien` ne copiera plus l’URL actuelle.
- `Partager` n’enverra plus l’URL actuelle.
- Les deux actions généreront un lien tracké dédié, mais avec des usages différents :
  - `Copier le lien` : copie un texte prêt à coller + lien affilié.
  - `Partager` : ouvre le partage natif avec un texte plus court + lien affilié, et donne accès au kit partage.

2. Ajouter une couche de tracking d’affiliation en base
Créer 2 tables dédiées :
- `community_affiliate_links`
  - marcheur_user_id
  - exploration_id
  - marche_event_id éventuel
  - share_token unique
  - channel (`copy`, `share`)
  - generated_count
  - last_generated_at
- `community_affiliate_events`
  - affiliate_link_id
  - event_type (`button_click`, `link_generated`, `landing_view`, `signup_started`, `account_created`)
  - visitor/session metadata sobre
  - created_at

Pourquoi 2 tables :
- 1 table “lien” pour agréger les stats par marcheur
- 1 table “événements” pour l’analytique fine et l’évolution future

3. Définir les règles de comptage
- “Combien de liens envoyés” :
  - compteur A = clics sur boutons
  - compteur B = liens trackés générés
- “Combien de consultations” :
  - nombre de `landing_view`
- “Combien d’affiliés créés” :
  - nombre de `account_created`
- Attribution :
  - un compte créé est attribué au lien si la personne arrive avec le token puis s’inscrit dans un délai défini
  - stockage du token en local/session côté navigateur jusqu’à l’inscription

4. Créer la page publique dédiée de partage
Ajouter une nouvelle route publique, par exemple :
- `/marches-du-vivant/rejoindre/:token`
Cette page sera pensée comme une landing “wahou” et inspirante, distincte de l’espace connecté.

Contenu de la landing
- Hero immersif avec nom de l’exploration / de la marche
- Fréquence du jour à l’ouverture
- Mise en avant des 3 volets :
  - Biodiversité : données collectées / espèces / APIs déjà exploitées par le projet
  - Bioacoustique : sons publics disponibles
  - Géopoétique : textes publics disponibles
- Galerie de médias téléchargeables
- Preuves vivantes : marcheurs, contributions, territoire
- CTA principal : rejoindre la communauté
- CTA secondaire : découvrir l’exploration
- Mention légère du marcheur invitant

5. Préparer le “Kit partage” pour le bouton Partager
Le bouton “Partager” produira 3 livrables cohérents :
- LIV 1 : page publique dédiée ultra-design
- LIV 2 : URL trackée
- LIV 3 : tracking par marcheur (liens générés + vues + comptes créés)

UX prévue :
- clic sur “Partager”
- génération/récupération du lien affilié
- ouverture du partage natif si disponible
- sinon copie d’un message court
- affichage d’un petit panneau/modal “Kit prêt” avec :
  - URL
  - bouton copier
  - aperçu du message
  - accès à la landing

6. Transformer “Copier le lien” en vrai message d’invitation
Le bouton “Copier le lien” copiera un texte long prêt à envoyer, avec humour doux et tonalité inspirante.
Structure du message :
- accroche personnelle
- clin d’œil humoristique
- invitation à rejoindre la communauté
- synthèse de la raison d’être / comment / quoi
- lien affilié tracké

Exemple d’intention rédactionnelle
- ton chaleureux, poétique, accessible
- humour léger du type : “promis, aucune obligation de parler aux arbres dès le premier jour”
- CTA clair vers la communauté des Marcheurs du Vivant

7. Relier l’inscription communautaire au referral
Dans `useCommunityAuth` / page de connexion-inscription :
- détecter un token d’affiliation présent en URL ou stocké localement
- au moment du sign up réussi :
  - enregistrer un événement `account_created`
  - rattacher la conversion au marcheur émetteur
- éventuellement enregistrer `signup_started` dès l’arrivée sur le formulaire

8. Ajouter un tableau de bord de suivi par marcheur
Enrichir l’admin communautaire ou l’outil le plus pertinent avec :
- marcheur
- exploration concernée
- clics boutons
- liens générés
- vues de landing
- comptes créés
- taux de conversion
- tri décroissant par conversions
Et, si souhaité plus tard, une vue “dans Mon Espace” pour que chaque marcheur voie son impact d’ambassadeur.

9. Données et sécurité
- RLS stricte :
  - un marcheur authentifié peut créer/générer ses propres liens
  - seuls admins voient l’analytique globale
  - la landing publique peut lire uniquement les données publiques nécessaires
- ne rien casser dans les URLs publiques existantes
- ne pas réutiliser l’URL de `mon-espace` comme lien externe
- préserver la compatibilité des routes publiques existantes

10. Fichiers probablement impactés
Frontend
- `src/components/community/exploration/MarcheursTab.tsx`
- `src/pages/MarchesDuVivantConnexion.tsx`
- `src/hooks/useCommunityAuth.ts`
- `src/App.tsx`
- nouveau composant/page de landing publique de referral
- éventuel hook utilitaire de génération / tracking de liens

Base Supabase
- migration pour tables de referral/analytics
- politiques RLS adaptées
- possiblement une fonction SQL simple d’agrégation si utile pour le dashboard

Détail UX/UI attendu
- Style premium, inspirant, immersif, plus éditorial qu’un simple écran fonctionnel
- Hero avec dégradés organiques, métriques vivantes, cartes piliers, médias mis en scène
- Mobile-first : les CTA principaux doivent être visibles sans confusion
- “Copier le lien” et “Partager” doivent avoir des feedbacks très différents pour éviter toute ambiguïté
- Le système doit donner le sentiment d’inviter à une communauté vivante, pas de pousser un lien technique

Point important à valider implicitement dans l’implémentation
- Pour le volet biodiversité de la landing, je proposerai de partir des données déjà accessibles publiquement dans l’exploration et, si disponible, des snapshots/observations déjà stockés, sans dépendre d’un appel externe temps réel au moment du chargement.

Résultat attendu
- “Copier le lien” : un vrai texte d’invitation + lien affilié tracké
- “Partager” : un kit partage distinct + lien tracké + landing publique “wahou”
- suivi par marcheur :
  - clics bouton
  - liens générés
  - consultations
  - comptes créés
- aucune confusion entre espace connecté et partage public
