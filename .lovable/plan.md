# Feuille de route « Retours Vincent Levavasseur » — page partenaire VDTP

Objectif : transformer l'interview du 7 août 2026 avec Vincent Levavasseur (Verre de Terre Production) en une feuille de route de travaux priorisée, publiée sur une page web protégée `/partenaires/vdtp/2026-08-12`, avec verbatims, planning daté et export PDF A4.

Accès : mot de passe existant de l'audit partenariat (`WINWIN20262037`), page en `noindex, nofollow`.

## Ce que dit l'interview (thèmes retenus)

1. Perte de données dans « J'analyse le sol » pendant son test, et impossibilité de sortir du mode édition (« j'ai tout fait planter »).
2. Trop d'informations analytiques : il veut du synthétique par défaut, le détail derrière un clic.
3. Concordance sol/flore : une seule échelle à 5 crans par facteur (Eau, Nutrition, pH), pas deux lignes opposées ; texture affichée en mot (« argilo-limoneux ») plutôt qu'en triangle.
4. La bio-indication doit pondérer par l'abondance : un pied de coquelicot ne pèse pas autant qu'une achillée qui couvre tout.
5. Le test MERCI (biomasse) doit devenir l'entrée forte du diagnostic de sol, à cheval entre « J'analyse » et « J'identifie ».
6. Hiérarchiser les tests : structure + boudin en essentiels, sédimentation / pH / vinaigre / sachet de thé en optionnels ; inviter à une analyse de sol labo dans les cas complexes.
7. « J'observe » : ajouter le volet arrosage (réseau, toiture, mare/rivière, puits/forage) ; supprimer l'encart « Signature écologique » jugé incompréhensible.
8. Restructurer la navigation : « Je synthétise » disparaît, son contenu remonte dans le Portrait ; à sa place un onglet « Mon projet » (recommandations, contraintes, vigilances) faisant le pont vers la Palette végétale / l'Atelier.
9. Ce que cherchent les gens d'abord : « suis-je dans les clous ? » et « quelles réponses à mes problèmes ? » — donc mettre en avant une barre de question + l'IA Jardin.
10. Galerie de jardins inspirants : ~15 jardins de personnes à notoriété, navigation de jardin en jardin, portraits très synthétiques.
11. Méthode et sources : afficher l'encart méthodologique (FFF / D.S.), et ouvrir vers Julve (open source) et Ellenberg en comparaison.
12. Données capteurs : 3 sondes de sol (15/30/60 cm) + station météo à installer sur le site — différenciation forte.

## Feuille de route priorisée

### P0 — Fiabilité (semaine du 10 août)
- Verrou anti-perte de données « J'analyse » : audit du chemin d'écriture restant, confirmation que le mode lecture seule et le garde-fou base sont actifs sur tous les points d'entrée, test de reproduction du scénario Vincent (Safari, édition puis sortie).
- Sortie du mode édition : bouton « Terminer » visible en haut et en bas, sortie sans perte, message de confirmation.
- Bandeau « Historique du registre » plus visible avec restauration en un clic.

### P1 — Lisibilité et synthèse (semaines du 10 et 17 août)
- Concordance sol/flore : refonte en 5 échelles à 5 crans (Eau sec↔frais, Nutrition pauvre↔riche, pH acide↔calcaire, plus texture en libellé), curseur unique par facteur, détail « n plantes » replié derrière un clic.
- Suppression de l'encart « Signature écologique ».
- « J'identifie » : verdict synthétique en tête (4 mots-clés), cortège détaillé en second rideau.
- Encart méthode (D.S. / Flore Forestière Française) présent à l'écran comme à l'impression, avec sources et pointeurs.

### P2 — Justesse scientifique (fin août / septembre)
- Pondération par abondance : coefficient de recouvrement/abondance par espèce, recalcul des indices bio-indicateurs, affichage de l'espèce dominante.
- Hiérarchisation des tests de sol : essentiels (structure, boudin) vs optionnels (sédimentation, pH, vinaigre, sachet de thé), avec durée annoncée par test et invitation à l'analyse labo.
- Comparaison des référentiels : ajout de Julve et Ellenberg en regard de D.S., affichage des écarts.

### P3 — Structure produit (septembre)
- « J'observe » : bloc arrosage (source d'eau, mode, fréquence) intégré au diagnostic et au portrait.
- Navigation : « Je synthétise » fusionné dans le Portrait ; nouvel onglet « Mon projet » (recommandations, contraintes, vigilances) reliant diagnostic et Palette/Atelier.
- Mise en avant de l'IA Jardin : barre de question « Posez une question sur votre jardin » en entrée de propriété.

### P4 — Test MERCI (septembre / octobre)
- Protocole MERCI simplifié : relevé d'espèces + pesée ou estimation photo de biomasse, fenêtre de saisie (juin), restitution en capacité fertilisante du sol.
- Positionnement du module à cheval « J'analyse » / « J'identifie », réutilisation du relevé de flore existant.

### P5 — Rayonnement et capteurs (octobre et au-delà)
- Galerie de jardins inspirants : ~15 portraits, navigation de jardin en jardin, portrait ultra-synthétique, statut ambassadeur optionnel.
- Ingestion des sondes de sol (3 profondeurs) et de la station météo, séries temporelles et écarts sol/air.

## Planning
Jalons datés du 10 août au 31 octobre 2026, avec la revue partenaire du 12 août 2026 comme point de départ affiché en tête de page, et un statut par chantier (À faire / En cours / Livré).

## Détails techniques

- Nouveau registre `src/lib/partnerRoadmaps/` : `types.ts` (thème, verbatim, chantier avec priorité/effort/livrable/statut, jalon), `vdtpRoadmap.ts` (contenu statique issu de l'interview), `index.ts` (résolution par slug + date). Aucune table à créer.
- Nouvelle page `src/pages/PartenaireFeuilleDeRoute.tsx`, route `/partenaires/:slug/:date` déclarée **après** `/partenaires/:slug/offre` et avant `/partenaires/:slug` dans `src/App.tsx`, en `lazyWithRetry` comme les autres pages.
- Mur de mot de passe repris de `PartenaireOffre.tsx`, avec `PARTNER_AUDIT_PASSWORD` importé de `src/lib/partnerAudits`.
- Composants de rendu dans `src/components/partners/roadmap/` : bandeau de synthèse (nombre de chantiers par priorité), colonnes de priorité P0→P5, carte de chantier, bloc verbatim citant Vincent avec horodatage, frise de planning.
- Impression : `RoadmapPrintLayout.tsx` + bloc `@media print` dédié dans `src/index.css`, sur le modèle de `PartnerOfferPrintLayout`, bouton « Imprimer / PDF ».
- Métadonnées : `Helmet` avec `noindex, nofollow`, titre « Feuille de route — VDTP × La Fréquence du Vivant ».
- Lien depuis le CRM à côté des boutons « Audit partenariat » et « Offre » existants.
