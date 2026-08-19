# Arbitrer le logo « Les Marches du Vivant »

## Où sont les propositions

La galerie existe déjà : **/roadmap/frequence-jardin**, section « Logos » (10 propositions, 3 familles), chaque logo ayant sa page dédiée `/roadmap/frequence-jardin/logo/:slug`.

Famille **Les Marches du Vivant** — 3 directions :
- `sentier-frequence` — Sentier en fréquence : un chemin qui devient onde, parmi graminées et ombelles.
- `empreinte-vivante` — Empreinte vivante : une empreinte de pas remplie de feuillage, entourée d'ondes concentriques.
- `horizon-marche` — Horizon marché : horizon de courbes traversé par un signal ambré.

## Ma recommandation : « Empreinte vivante »

Raisons, en tenant compte des ramifications (Fréquence Jardin, IoT/partenaires, Trust, Agent IA, exports PDF/Word) :

1. **Système de marque cohérent.** L'ombrelle est la Feuille-signal (nervure = onde), Jardin part de la graine. L'empreinte + ondes concentriques complète la triade sans redite : une forme centrée, un motif d'onde partagé, un sujet propre (le pas).
2. **Tenue en très petit.** Forme compacte et refermée : favicon, avatar QR/e-mail, pastille d'annuaire, en-tête d'export. Le Sentier et l'Horizon sont des compositions étirées qui se brouillent sous 32 px.
3. **Portage du sens produit.** La trace du marcheur devient donnée qui se propage (observations → snapshots → Fréquence). C'est exactement la promesse de l'app, lisible sans légende.
4. **Déclinabilité.** Monochrome, détouré, en filigrane de rapport, en tampon de certificat — l'empreinte résiste ; un paysage non.

À garder en second rôle : **Horizon marché** comme motif de bandeau/couverture (hero, OG image, en-tête de PDF), sans statut de logo. Le Sentier reste une illustration éditoriale.

Pour Fréquence Jardin, la cohérence appelle **Germination — cercle** (même logique de sceau lisible en petit), avec « Germination — onde pleine » en bandeau.

## Ce que je propose de faire ensuite (à ta validation)

1. Ajouter un champ `status` aux entrées de logo (`retenu` | `variante` | `écarté`) dans `src/content/frequenceJardinFiche.ts`, et afficher un badge « Retenu » sur la fiche et la page logo.
2. Marquer `empreinte-vivante` comme retenu pour la famille Marches, `feuille-signal-la-frequence-du-vivant` pour l'ombrelle, et laisser Jardin en attente ou marquer `germination-cercle` selon ton arbitrage.
3. Ajouter sur la fiche un court bloc « Arbitrage » rappelant la règle d'emploi : ombrelle en signature, logo applicatif en interface, motif paysager réservé aux bandeaux.
4. Optionnel (à confirmer) : brancher réellement le logo retenu dans l'interface — favicon, en-tête de l'app Marcheurs, en-têtes d'exports PDF/Word, images OG. C'est un chantier séparé, à faire seulement si tu le veux dans la foulée.

## Détails techniques

- Aucun changement de données : les logos sont des pointeurs `.asset.json` déjà en CDN, référencés dans `src/content/frequenceJardinFiche.ts`.
- Le type `FicheLogo` gagne `status?: 'retenu' | 'variante'` ; `FrequenceJardinFiche.tsx` et `FrequenceJardinLogo.tsx` affichent le badge et une phrase d'emploi.
- Les URL publiques des pages logo restent inchangées.

## Question ouverte

Veux-tu que je limite ce lot à l'arbitrage documenté (points 1–3), ou que j'enchaîne aussi le déploiement du logo dans l'app (point 4) ?
