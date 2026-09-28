# Espace partenaire Ver de Terre Production — suivi des briques livrées

## Constat

- La page de négociation est `/offre-VDT-MDV` (`src/pages/OffreVdtMdv.tsx`), créée le **9 juillet 2026** : proposition confidentielle présentant les briques La Fréquence du Vivant.
- Le configurateur `/partenaires/vdtp/configurateur` (code WINWIN20262037) est arrivé le 18 septembre 2026.
- Depuis le 9 juillet, de nombreuses briques ont été livrées (IoT sondes/météo, Herbier du moment, Chantier avant/après + Cortège vivant, démonstrateurs animés, plan d'action IA, exports…) sans qu'aucune page ne les récapitule pour le partenaire.

## Proposition : un « Journal des briques » valorisant

### 1. Page publique partenaire `/partenaires/vdtp/journal` (nouvelle)

- Frise chronologique élégante (mobile first) : chaque brique livrée depuis le 9 juillet 2026 = une carte datée, avec titre, courte description en langage métier paysagiste, et lien vers la démo ou la page concernée.
- Regroupement par thème : Observer (biodiversité, herbier), Mesurer (IoT, sol), Raconter (démonstrateurs animés, rapports), Piloter (chantier, ICG, plan IA).
- En-tête reprenant l'identité de la page de négociation (même ton « Proposition · Ver de Terre Production ») pour la continuité commerciale.
- Mention honnête : « Briques livrées et en cours — mise à jour à chaque livraison ».

### 2. Source de contenu unique

- Fichier `src/content/vdtp/journal.ts` : liste typée des briques (date, titre, description, thème, lien, statut livré/en cours). Ajouter une brique = une entrée, sans toucher à la page.
- Les dates réelles de création sont retrouvées via l'historique du code.

### 3. Liens depuis l'existant

- Bouton « Voir les briques livrées » ajouté sur `/offre-VDT-MDV` et en bas du configurateur, pour boucler le parcours commercial : proposition → journal des livraisons → configurateur.

### 4. Signaux SEO/GEO

- Ajout de la page au `sitemap.xml` et à `llms.txt` (section partenariats), cohérent avec ce qui a été fait pour la Chambre d'agriculture.

## Technique

- Nouvelle page `src/pages/VdtpJournal.tsx` + contenu `src/content/vdtp/journal.ts` ; route déclarée dans `src/App.tsx` près des autres routes vdtp.
- Aucun changement de base de données. Aucune modification des animations, du configurateur ou de la page de négociation existante (hors l'ajout du bouton de lien).
- Vérification : compilation `tsgo`, rendu mobile 375 px, présence dans le sitemap.

## Suites possibles validées

- Protéger le journal par le même code que le configurateur si vous préférez le garder confidentiel.
- Décliner le même « Journal des briques » pour la Chambre d'agriculture Pays de la Loire.