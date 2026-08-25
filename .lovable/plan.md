# Page Soil Acoustics : reconstruire à partir du PPTX

La page actuelle est une reformulation libre en 7 blocs. Elle sera remplacée par une structure qui suit fidèlement les 10 slides du PPTX joint, en FR et en EN, sans tiret cadratin nulle part.

## Structure cible (1 section par slide)

1. **Hero** : « Écouter le sol. Ensemble. » / "Listening to soil. Together." Proposition de partenariat technologique, bioacoustique du sol × 106 sites déjà documentés en France, Laurent Tripied, Fondateur, août 2026. CTA Calendly + lien Soil Acoustics.
2. **Enjeux et opportunités** : les 3 constats (angle mort de la gestion, demande de preuve d'impact, communauté prête) avec les 4 chiffres du slide : 1 an, 100+ marcheurs-ambassadeurs, 106 propriétés, 3 offres complémentaires.
3. **Ce dont nous disposons déjà** : 3 colonnes (Stack ouverte, Données croisées, Capteurs déjà intégrés) avec le détail exact du slide (Supabase/PostGIS, Edge Functions Deno, API/MCP/n8n, React ; GBIF, iNaturalist, Xeno-Canto, eBird, INPN, Open-Meteo, Météo-France, Copernicus, IGN, Cadastre, Corine Land Cover ; météo in situ, température et humidité du sol, snapshots versionnés). Encart « Il manque une couche : le son du sol » + Pack Vivant.
4. **Quatre applications** : Les Marches du Vivant, Fréquence Jardin (Ver de Terre Production), Fréquence Vignoble, PiloTerra, avec les publics associés (ambassadeurs, paysagistes, vignerons, coopératives).
5. **La pièce manquante** : deux colonnes face à face, « Ce que nous avons compris de SAM » (4 points : sonde portable brevetée Baker Consultants × Warwick / DEFRA, mesure rapide non invasive, base de sons et algorithmes, tests Ruinart, JoJo's Vineyard, National Trust) et « Pourquoi cela s'emboîte » (nos protocoles, nos capteurs, notre temporalité, notre récit).
6. **Ce que nous recherchons** : les 4 briques (solution mobile pour les marches, accès à l'achat pour les grands sites, accès API aux données marqué comme priorité, communication croisée).
7. **Ce que nous apportons en retour** : les 4 chiffres 106 / 100+ / 2 / 1 avec leur libellé, plus l'encart récit (chaque site devient une histoire publiée).
8. **Calendrier** : frise 4 étapes Sept / Oct / Nov / Déc avec les puces de chaque mois et la note de fin décembre 2026.
9. **Proposition de pilote** : « Ce que nous proposons » (4 points) et « Ce que nous mesurons ensemble » (4 points), plus l'engagement (rapport partagé, cas d'usage publiables, décision avant fin 2026).
10. **Clôture** : citation du manifeste, coordonnées Laurent Tripied (fondateur, CEO bziiit & PiloTerra, +33 6 70 76 14 99, la-frequence-du-vivant.com, piloterra.fr) et CTA Calendly final.

La section « Où en sont les discussions » actuelle est supprimée : le PPTX porte un calendrier engageant, pas un statut d'attente.

## Règles de rédaction

- Aucun « — » (tiret cadratin) ni « – » : ponctuation en virgules, deux-points, parenthèses ou points.
- FR = reprise quasi littérale du texte des slides. EN = version anglaise professionnelle, construite à partir des notes « EN clés » de chaque slide (déjà rédigées par vous), pas une traduction automatique.
- Les questions du slide 10 (notes) restent hors page publique : ce sont vos notes d'appel.

## Ce qui ne change pas

- URL publique `/partners/soil-acoustics`, bascule EN/FR via `?lang=`.
- CTA Calendly `calendly.com/laurent-bziiit/entretien-ia`, lien Soil Acoustics, email de contact.
- Bouton PDF et impression A4 paysage, SEO + JSON-LD, absence de logo dans la barre haute.

## Détails techniques

- `src/content/soilAcousticsPartnership.ts` : nouveau type `SaContent` couvrant les 10 sections, deux objets `fr` et `en` complets. Constantes d'URL inchangées.
- `src/pages/PartnersSoilAcoustics.tsx` : sections réécrites d'après le nouveau modèle (grille de chiffres, colonnes face à face, frise 4 mois, double liste pilote). Visuel « Listen » SVG conservé dans le hero.
- `src/styles/soil-acoustics.css` : ajout des classes des nouveaux blocs (`sa-stats`, `sa-facing`, `sa-timeline`, `sa-pilot`) et de leurs règles `@media print` pour que le PDF reste propre.
- Vérification finale : rendu FR et EN dans l'aperçu, plus un contrôle qu'aucun caractère `—` ne subsiste dans les deux fichiers de contenu.
