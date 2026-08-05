# Dossier « Vienne Nature × La Fréquence du Vivant » — catalogue Outils & Services

Objectif : une page web protégée (mot de passe, comme l'audit partenariat) + un export imprimable A4 et un export Excel, présentant ce que nous pouvons apporter à Vienne Nature dans un consortium de réponse aux marchés publics.

Base d'analyse : les 10 marchés du fichier fourni (ABC Grand Poitiers, animation Natura 2000, Re-Sources captages, inventaire herpétologique, diagnostic des sources, ENS du Léché, mulettes Gartempe/Creuse, PAEC MONT, suivis LGV Malaguet, arbres remarquables). Aucun prix affiché.

## Structure du dossier

### 1. Lecture des marchés
Tableau de synthèse des 10 marchés, avec pour chacun la nature des livrables attendus (rapports, cartographies SIG, bases de données d'occurrences, fiches par site ou par exploitation) et le ou les blocs de notre technologie qui s'y branchent. Ce tableau sert de preuve que l'offre est calée sur leur pratique réelle, pas sur un catalogue générique.

### 2. CE QUE NOUS FAISONS RÉGULIÈREMENT — OUTILS
Chaque outil est décrit avec : ce qu'il fait, sur quel marché-type il sert, et l'écran ou l'export existant qui le prouve. Uniquement de l'existant :

- Application Les Marches du Vivant : collecte terrain géolocalisée, photos horodatées avec EXIF, observations rattachées à un observateur et à une session.
- Espace Propriété / Site : diagnostic en 5 étapes (J'observe, J'analyse le sol, J'identifie la flore, Le tri du cortège, Palette végétale), avec score ICG avant/projeté/constaté.
- Atelier cartographique : cadastre et IGN, orthophoto haute résolution, dessin d'ouvrages, cotation des dimensions, filtrage strict des observations par périmètre géométrique.
- Base flore bio-indicatrice : 58 espèces, coefficients E/T/N/pH, méthode D.S. et Flore Forestière Française, exportable Excel/CSV.
- Moteur d'agrégation biodiversité : déduplication par nom scientifique, fusion observations citoyennes et iNaturalist, comptages consolidés par site et par période.
- Chaîne d'export : Pack Vivant (PDF, Excel, CSV, GeoJSON, KML), dossier de chantier avant/après, atlas du cortège imprimable, planches photo A4.
- Serveur MCP : accès machine aux données de site (fiche, biodiversité, pool d'espèces, points d'observation, diagnostics), authentifié par utilisateur — permet à leurs propres outils ou à une IA de lire nos données.
- Connecteurs API : GBIF, iNaturalist, Xeno-Canto, Open-Meteo, Sentinel Hub, Cadastre/IGN, Lexicon.
- Pages publiques et carnets de terrain : restitution grand public d'une sortie ou d'un site, avec réglage de visibilité.
- IA de terrain contextuelle : réponses appuyées uniquement sur les données du site chargées, avec bordereau traçant les contextes utilisés.

### 3. CE QUE NOUS FAISONS RÉGULIÈREMENT — SERVICES
- Structuration et reprise de bases d'occurrences existantes.
- Animation de sessions de collecte participative (marches, inventaires citoyens) et formation des bénévoles.
- Production de livrables imprimés conformes aux attentes des donneurs d'ordre.
- Restitution publique et médiation (pages site, carnets, matériel pédagogique).
- Ouverture et interopérabilité des données (exports normalisés, versement GBIF).
- Support technique et hébergement pendant la durée du marché.

### 4. CE QUE NOUS POUVONS RÉALISER AVEC DES DÉVELOPPEMENTS COMPLÉMENTAIRES
Chantiers chiffrés en durée uniquement, chacun sous 3 mois, alignés sur les marchés du fichier :
- Module protocoles naturalistes : saisie protocolée par maille (herpétofaune, odonates, chiroptères) avec pression d'observation.
- Module linéaires et points d'eau : mares, haies, sources — saisie, cartographie, fiches de station.
- Module trame noire : croisement pollution lumineuse et observations nocturnes.
- Module habitats : typologie EUNIS, relevés phytosociologiques, cartographie d'habitats.
- Module suivi d'état de conservation Natura 2000 : indicateurs, séries temporelles, fiches d'évaluation d'incidence.
- Module diagnostic d'exploitation agricole : fiche d'admissibilité MAEC par exploitation, export par lot.
- Module sonde de sol : ingestion des relevés multi-paramètres, rattachement aux prélèvements existants, séries temporelles.
- Module bioacoustique : import d'enregistrements, rattachement Xeno-Canto, écoute et validation.
- Module vulnérabilité des sols et intrants : croisement sol, satellite et parcellaire sur aire d'alimentation de captage.
- IA vocale de terrain : saisie mains libres pendant la prospection.
- Export réglementaire : gabarits de rapport et de tableau conformes aux formats DREAL / Agence de l'Eau.

Chaque chantier indique : déclencheur (quel marché le justifie), durée, et ce qu'il produit comme livrable.

### 5. Modes de collaboration
Deux positions présentées côte à côte, à choisir selon la taille du marché : sous-traitance technique (Vienne Nature mandataire) ou cotraitance en groupement. Pour chacune : répartition des rôles, propriété des données, engagements.

### 6. Questions à trancher avant la présentation à la direction
Section visible dans le dossier, pour cadrer l'échange : gouvernance et propriété des données collectées, hébergement et RGPD, validation scientifique des identifications, articulation avec leurs outils existants (Serena, Faune-Vienne ou équivalent), versement GBIF, engagement de continuité au-delà du marché, réversibilité et export en cas de fin de collaboration.

## Détails techniques

- Nouveau registre `src/lib/partnerOffers/` sur le modèle de `src/lib/partnerAudits/` : `types.ts`, `vienneNatureOffer.ts`, `index.ts`. Contenu 100 % statique en TypeScript, aucune table à créer.
- Nouvelle page `src/pages/PartenaireOffre.tsx`, route `/partenaires/:slug/offre`, réutilisant le mur de mot de passe existant (`PARTNER_AUDIT_PASSWORD`) et la même charte que `PartenaireAudit.tsx`.
- Composants de rendu dans `src/components/partners/offer/` : lecture des marchés, grilles Outils / Services, chantiers de développement, modes de collaboration, questions.
- Impression : `PartnerOfferPrintLayout.tsx` + bloc `@media print` dédié dans `src/index.css`, sur le modèle de `PartnerAuditPrintLayout`.
- Export Excel : fichier généré côté sandbox dans `/mnt/documents` (onglets Marchés, Outils, Services, Développements) et téléchargeable ; pas de dépendance nouvelle côté app.
- Lien depuis le CRM à côté du bouton « Audit partenariat » existant.
