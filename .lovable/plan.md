# Feuille de route « Retours Vincent Levavasseur » — page partenaire VDTP

Objectif : transformer l'interview du 7 août 2026 avec Vincent Levavasseur (Verre de Terre Production) en une feuille de route de travaux priorisée, publiée sur une page web protégée `/partenaires/vdtp/2026-08-12`, avec verbatims, planning daté, schémas, graphiques et export PDF A4.

Accès : mot de passe existant de l'audit partenariat (`WINWIN20262037`), page en `noindex, nofollow`.

Changement acté : les 3 sondes de sol sont posées et l'API est accessible. L'ingestion capteurs monte donc en **P3**, avant la restructuration produit et le test MERCI.

## Ce que dit l'interview (thèmes retenus)

1. Perte de données dans « J'analyse le sol » pendant son test, et impossibilité de sortir du mode édition (« j'ai tout fait planter »).
2. Trop d'informations analytiques : synthétique par défaut, détail derrière un clic.
3. Concordance sol/flore : une seule échelle à 5 crans par facteur (Eau, Nutrition, pH), pas deux lignes opposées ; texture affichée en mot (« argilo-limoneux »).
4. La bio-indication doit pondérer par l'abondance : un pied de coquelicot ne pèse pas autant qu'une achillée qui couvre tout.
5. Le test MERCI (biomasse) doit devenir l'entrée forte du diagnostic de sol, à cheval entre « J'analyse » et « J'identifie ».
6. Hiérarchiser les tests : structure + boudin en essentiels ; sédimentation / pH / vinaigre / sachet de thé en optionnels ; inviter à une analyse labo dans les cas complexes.
7. « J'observe » : ajouter le volet arrosage (réseau, toiture, mare/rivière, puits/forage) ; supprimer l'encart « Signature écologique » jugé incompréhensible.
8. Navigation : « Je synthétise » disparaît, son contenu remonte dans le Portrait ; à sa place « Mon projet » (recommandations, contraintes, vigilances) faisant le pont vers la Palette végétale / l'Atelier.
9. Ce que cherchent les gens d'abord : « suis-je dans les clous ? » et « quelles réponses à mes problèmes ? » — mettre en avant une barre de question + l'IA Jardin.
10. Galerie de jardins inspirants : ~15 jardins de personnes à notoriété, navigation de jardin en jardin, portraits très synthétiques.
11. Méthode et sources : encart méthodologique (D.S. / Flore Forestière Française), ouverture vers Julve (open source) et Ellenberg en comparaison.
12. Capteurs : 3 sondes de sol (15 / 30 / 60 cm) + station météo — différenciation forte de l'offre.

## Feuille de route priorisée

### P0 — Fiabilité (semaine du 10 août)
- Verrou anti-perte de données « J'analyse » : audit du chemin d'écriture restant, vérification que le mode lecture seule et le garde-fou base couvrent tous les points d'entrée, reproduction du scénario Vincent (Safari, édition puis sortie).
- Sortie du mode édition : bouton « Terminer » visible en haut et en bas, sortie sans perte, confirmation explicite.
- Bandeau « Historique du registre » plus visible, restauration en un clic.

### P1 — Lisibilité et synthèse (semaines du 10 et 17 août)
- Concordance sol/flore : 5 échelles à 5 crans (Eau sec↔frais, Nutrition pauvre↔riche, pH acide↔calcaire, texture en libellé), curseur unique par facteur, détail « n plantes » replié derrière un clic.
- Suppression de l'encart « Signature écologique ».
- « J'identifie » : verdict synthétique en tête (4 mots-clés), cortège détaillé en second rideau.
- Encart méthode (D.S. / FFF) à l'écran comme à l'impression, avec sources et pointeurs.

### P2 — Justesse scientifique (fin août)
- Pondération par abondance : coefficient de recouvrement par espèce, recalcul des indices bio-indicateurs, mise en avant de l'espèce dominante.
- Hiérarchisation des tests de sol : essentiels (structure, boudin) vs optionnels (sédimentation, pH, vinaigre, sachet de thé), durée annoncée par test, invitation à l'analyse labo.
- Comparaison des référentiels : Julve et Ellenberg en regard de D.S., affichage des écarts.

### P3 — Capteurs sol & météo : ingestion et séries temporelles (début septembre)
Sondes déjà posées, API disponible : le chantier devient prioritaire car il apporte de la donnée mesurée là où tout le reste est déclaratif.
- Connecteur d'ingestion : fonction edge planifiée qui interroge l'API des sondes et de la station météo, normalise les mesures et les stocke en série temporelle (horodatage en heure locale de Paris, conformément à la règle du projet).
- Modèle de données : table de capteurs (sonde 15 cm, 30 cm, 60 cm, sonde de surface à 10 cm, station météo à 3 m) rattachés à la propriété et à une zone (potager d'hiver, potager d'été, verger), plus une table de mesures (température, humidité).
- Restitution : onglet « Le sol vivant en continu » dans la propriété, avec courbes multi-profondeurs, sélecteur de période, et graphe d'écart sol/air (température de surface vs air à 3 m, humidité à 15/30/60 cm).
- Lecture agronomique : repères de seuils (sol gelé, sécheresse en profondeur, saturation), et croisement avec les prélèvements existants du registre.
- Ouverture : mesures exposées dans le contexte de l'IA Jardin et dans le serveur MCP, exportables en CSV.

### P4 — Structure produit (mi-septembre)
- « J'observe » : bloc arrosage (source d'eau, mode, fréquence) intégré au diagnostic et au portrait.
- Navigation : « Je synthétise » fusionné dans le Portrait ; nouvel onglet « Mon projet » (recommandations, contraintes, vigilances) reliant diagnostic et Palette/Atelier.
- Mise en avant de l'IA Jardin : barre « Posez une question sur votre jardin » en entrée de propriété.

### P5 — Test MERCI (fin septembre / octobre)
- Protocole simplifié : relevé d'espèces + pesée ou estimation photo de biomasse, fenêtre de saisie (juin), restitution en capacité fertilisante du sol.
- Module à cheval « J'analyse » / « J'identifie », réutilisant le relevé de flore existant.

### P6 — Rayonnement (octobre et au-delà)
- Galerie de jardins inspirants : ~15 portraits, navigation de jardin en jardin, portrait ultra-synthétique, statut ambassadeur optionnel.

## Schémas et graphiques à intégrer dans la page

### 1. Frise de priorisation

```text
Août 2026                Septembre 2026            Octobre 2026
|--------------------|-------------------------|--------------------|
P0 Fiabilite   ####
P1 Lisibilite     ##########
P2 Justesse            #########
P3 Capteurs                 ############
P4 Produit                        ##########
P5 MERCI                               ############
P6 Rayonnement                                    ##############
```

### 2. Chaîne de la donnée capteurs (P3)

```text
  Sonde 15cm ─┐
  Sonde 30cm ─┤                      ┌─ Courbes multi-profondeurs
  Sonde 60cm ─┼─> API constructeur ─> Fonction edge planifiee ─> Table mesures ─┼─ Graphe ecart sol/air
  Surface 10cm┤                      (normalisation, heure Paris)               ├─ Contexte IA Jardin
  Meteo 3m  ──┘                                                                 └─ Export CSV / MCP
```

### 3. Reconfiguration de la navigation (P4)

```text
AVANT :  J'observe > J'analyse > J'identifie > Je synthetise > Palette
APRES :  J'observe > J'analyse > J'identifie > Mon projet    > Palette / Atelier
                                        \
                                         └─> Portrait (synthese permanente, vitrine publique)
```

### 4. Graphiques dans la page
- Barres horizontales : nombre de chantiers et charge estimée par priorité.
- Camembert : répartition des retours par thème (fiabilité, lisibilité, science, données, produit).
- Courbe d'exemple sol/air sur 7 jours, illustrant la restitution capteurs cible.

## Planning
Jalons datés du 10 août au 31 octobre 2026, avec la revue partenaire du 12 août 2026 en tête de page et un statut par chantier (À faire / En cours / Livré).

## Détails techniques

- Nouveau registre `src/lib/partnerRoadmaps/` : `types.ts` (thème, verbatim, chantier avec priorité/effort/livrable/statut, jalon), `vdtpRoadmap.ts` (contenu statique issu de l'interview), `index.ts` (résolution par slug + date). Aucune table à créer pour la page.
- Nouvelle page `src/pages/PartenaireFeuilleDeRoute.tsx`, route `/partenaires/:slug/:date` déclarée après `/partenaires/:slug/offre` et avant `/partenaires/:slug` dans `src/App.tsx`, chargée via `lazyWithRetry`.
- Mur de mot de passe repris de `PartenaireOffre.tsx`, avec `PARTNER_AUDIT_PASSWORD` importé de `src/lib/partnerAudits`.
- Composants dans `src/components/partners/roadmap/` : bandeau de synthèse, colonnes de priorité P0→P6, carte de chantier, bloc verbatim horodaté, frise de planning, schéma de la chaîne capteurs (SVG), schéma de navigation avant/après (SVG), graphiques Recharts (barres, camembert, courbe sol/air d'exemple).
- Impression : `RoadmapPrintLayout.tsx` + bloc `@media print` dédié dans `src/index.css`, sur le modèle de `PartnerOfferPrintLayout` ; les schémas SVG et les graphiques sont rendus en version imprimable, sauts de page par priorité.
- Métadonnées : `Helmet` avec `noindex, nofollow`, titre « Feuille de route — VDTP × La Fréquence du Vivant ».
- Lien depuis le CRM à côté des boutons « Audit partenariat » et « Offre ».
- Le chantier P3 lui-même (ingestion réelle) fera l'objet d'une migration et d'une fonction edge dédiées, hors périmètre de la page : la page le décrit et le planifie.
