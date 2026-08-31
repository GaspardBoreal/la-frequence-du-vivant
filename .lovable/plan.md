# L'Entretien fondateur — transformer l'interview en moteur du jardin

L'interview d'initialisation de « Jardin nourricier Ormetteaux » est aujourd'hui un PDF de 37 pages, verbatim brut, multi-locuteurs. Elle contient pourtant l'essentiel : une citerne souple de 20 m³ à 1 300 €, un liner + 6 tonnes de sable 0,2 mm brouettées seule, du BRF livré par les paysagistes du voisinage, des pêchers semés de noyau il y a 7 et 8 ans, le chop and drop, le cap du jardin-forêt — et surtout une ligne rouge : « je ne coupe aucun arbre », « je refuse de faire de la maçonnerie ».

L'idée : faire de chaque entretien un **objet vivant de la propriété**, qui prouve qu'on a écouté, qui pré-remplit le dossier, et qui revient relancer la jardinière pendant des mois.

## 1. Un nouvel objet « Entretien » dans la propriété

Un onglet **Portrait › Entretiens**. On y dépose l'audio, le PDF de transcription ou le texte collé. Chaque entretien devient une fiche horodatée (ITW 01 · Découverte, ITW 02 · 6 mois…), avec sa durée, ses locuteurs et sa transcription lisible.

L'audio est transcrit par la brique de transcription déjà en place ; un PDF déposé est nettoyé de ses en-têtes et pieds de page avant analyse.

## 2. La Récolte : 5 registres extraits, jamais appliqués sans accord

L'IA relit l'entretien et propose des cartes classées en cinq registres :

- **Faits du lieu** — ouvrages, réserve d'eau, sol, arbres remarquables, âges, coûts. Chaque fait pointe vers un objet, un ouvrage, un chantier ou une parcelle à créer.
- **Gestes et pratiques** — BRF, chop and drop, semis de noyaux, récupération des broyats de haie. Alimente les gestes du jardin et la palette.
- **Lignes rouges** — ce qu'elle ne fera jamais. C'est le registre le plus précieux : il devient une contrainte permanente du système.
- **Portrait de la jardinière** — moteurs (apprendre de la nature, autonomie, fierté du geste), rapport au budget, temps disponible, seule ou accompagnée, style d'apprentissage, ton de dialogue qui lui convient. Rendu sous forme de carte « Comment vous accompagner », en langage respectueux et vérifiable, jamais en jargon psychologique.
- **Cap et intentions** — ce qu'elle veut dans six mois, ce qui l'inquiète.

Chaque carte est présentée en **60 secondes chrono** : Accepter · Ajuster · Écarter. Rien n'entre dans la propriété sans un clic. C'est la garantie de confiance : l'IA propose, la propriétaire décide.

## 3. Les Verbatims d'or

Chaque carte cite la phrase exacte, avec son minutage. Ces citations sont épinglables et réutilisées dans les rapports et l'interface. Voir sa propre phrase revenir dans son rapport d'initialisation est le signal le plus fort possible : « ils m'ont vraiment écoutée ».

## 4. Les lignes rouges deviennent un garde-fou système

Les lignes rouges validées sont injectées en garde-fou dans l'IA de Jardin et dans les suggestions d'ouvrages : plus aucune recommandation ne proposera d'abattre un arbre ou de couler une dalle sur cette propriété. Elles s'affichent aussi en bandeau discret dans l'Atelier et le Scénographe.

## 5. Le Rapport d'initialisation (le livrable de confiance)

Un PDF A4, généré depuis les cartes validées, en cinq temps :
1. Ce que vous nous avez dit — les verbatims d'or.
2. Ce que nous avons compris — le lieu, en faits datés et chiffrés.
3. Ce que nous ne ferons jamais — les lignes rouges, signées.
4. Vos trois premiers gestes — repris des gestes déjà générés, désormais nourris de l'entretien.
5. Nos engagements — jalons datés, dont le prochain entretien.

C'est ce document qui « gagne la confiance » : il ne contient rien qu'elle n'ait dit ou validé.

## 6. Le Fil de l'entretien (le moteur d'usage)

Chaque intention datée extraite de l'entretien devient une relance douce, au bon moment : « Vous vouliez remplir la citerne cet hiver — où en est-on ? », « Le pêcher semé il y a 7 ans : une photo ce mois-ci ? ». Une seule relance à la fois, dans l'esprit de sobriété du produit. C'est ce qui garantit le retour sur la plateforme sans notification agressive.

## 7. Avant / Après entretien

Un indicateur simple de complétude du dossier jardin, qui bondit après validation de la récolte, avec la mention des blocs encore vides. Puis, à ITW 02, une vue comparative : ce qui a bougé, ce qui a tenu, les phrases d'hier relues aujourd'hui.

## Ce qu'on construit, dans quel ordre

- **Étape 1** — l'objet Entretien : dépôt, transcription, lecture, récolte des 5 registres, écran de validation, application aux réponses d'intention et aux lignes rouges.
- **Étape 2** — Rapport d'initialisation PDF + verbatims d'or dans l'interface.
- **Étape 3** — Fil de l'entretien (relances) et vue Avant/Après, comparatif inter-entretiens.

## Détails techniques

- **Base** : `propriete_entretiens` (propriete_id, titre, tenu_le, source, duree, transcript, statut, consentement, created_by) et `propriete_entretien_extraits` (entretien_id, registre, titre, detail, verbatim, minutage, cible, payload jsonb, statut accepté/ajusté/écarté). GRANT explicites + RLS alignée sur `can_access_propriete` / `can_edit_propriete_onboarding` ; le registre « portrait » reste réservé au propriétaire, au marcheur principal et aux admins.
- **Écriture** : les cartes acceptées passent par la RPC existante `save_propriete_onboarding` (fusion `||`, jamais d'écrasement de `onboarding_preferences`), plus les insertions ciblées d'objets/ouvrages/chantiers via les hooks déjà en place.
- **Edge functions** : `entretien-transcribe` (réutilise la brique de transcription audio) et `entretien-harvest` (extraction structurée en JSON strict, un appel par registre pour rester frugal, sortie contrainte au schéma des cartes). Aucun texte inventé : chaque carte doit porter un verbatim source, sinon elle est rejetée.
- **Front** : `PortraitEntretiens.tsx` + `EntretienHarvestSheet.tsx` (validation carte par carte, mobile d'abord), `useProprieteEntretiens.ts`. Réutilisation stricte des composants Portrait existants et de `PortraitPrintLayout` pour le PDF.
- **IA de Jardin** : nouveau contexte attachable 📎 « Entretien fondateur » (résumé compact + lignes rouges) dans `useProprieteChatProviders.ts` ; les lignes rouges sont aussi passées en contrainte système côté `propriete-chat`.
- **Gestes** : `buildGestureContext` intègre les faits et le cap issus de l'entretien, ce qui régénère automatiquement les trois premiers gestes via l'empreinte existante.

## Vérification

Le PDF d'Ormetteaux sert de banc d'essai : on vérifie que la récolte retrouve bien la citerne 20 m³, le liner + sable 0,2 mm, le BRF des paysagistes, les pêchers de 7 et 8 ans, le chop and drop, le cap jardin-forêt et les deux lignes rouges (aucun arbre coupé, pas de maçonnerie) — chacun avec son verbatim et son minutage.
