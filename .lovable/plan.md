# Médias de terrain pour l'étape « J'analyse le sol »

Chaque prélèvement (A→E) devient une entité porteuse de médias : pour un test donné (boudin, bêche, pH…), l'utilisateur peut monter, remplacer, légender et supprimer plusieurs photos/vidéos courtes. Tout le monde ayant accès à la propriété les voit.

## 1. Stockage & données

**Bucket** `propriete-tests` (privé, servi via URL signées) — cohérent avec la confidentialité des propriétés.

**Table** `public.propriete_test_medias` :
- `propriete_id`, `sample_id` (« A »… correspond au `id` du prélèvement dans `samples`), `sample_label`, `sample_location` (copie figée au moment de l'upload, pour l'historisation)
- `block` (`structure` | `texture` | `ph` | `life`), `test_id` (`beche`, `stabilite`, `boudin`, `sedimentation`, `bandelette`, `phmetre`, `beche_vivante`, `vinaigre`, `sachet`)
- `media_type` (`photo` | `video`), `storage_path`, `mime`, `size_bytes`, `width`/`height`, `duration_s`
- `caption`, `taken_at` (EXIF si dispo), `uploaded_at`, `uploaded_by`, `order_index`
- GRANTs `authenticated` + `service_role`, RLS activée.

**Droits (validés)** : lecture pour toute personne liée à la propriété ; insertion par toute personne liée ; suppression/édition par l'auteur, le propriétaire/prestataire et les admins. Implémenté via une fonction `SECURITY DEFINER` `public.can_access_propriete(uuid)` (même logique que `upsert_propriete_soil`) réutilisée dans les policies, plus `can_curate_propriete_gallery` pour la suppression. Policies miroir sur `storage.objects` pour le bucket.

**Pipeline upload** : réutilise `preparePhotoForUpload` (EXIF + conversion HEIC) et `insertWithStorageRollback` déjà en place — pas de doublon de logique. Vidéos : MP4/MOV/WebM ≤ 60 Mo, vignette générée côté client (capture de la 1ʳᵉ frame), pas de transcodage.

## 2. UI — dans chaque ligne de test

Sur `TextureSampleRow` d'abord (puis `StructureSampleRow`, `PhSampleRow`, `LifeSampleRow` : même composant partagé) :

- Une **pastille photo** à droite de la ligne : cercle en verre dépoli avec la 1ʳᵉ vignette empilée façon polaroïd, compteur `3` en médaillon doré ; à vide, un contour pointillé pulsant « + preuve visuelle ».
- Clic → **tiroir « Preuves de terrain »** : bandeau titre `Potager · Test du boudin`, grille de vignettes carrées (drag & drop pour réordonner), zone de dépôt plein cadre avec animation d'accueil, légende inline sous chaque média, bouton supprimer discret au survol.
- Chaque vignette affiche la **date/heure d'upload** en surimpression fine, badge ▶ pour les vidéos.
- **Visionneuse plein écran** (reprend `VideoLightbox`) avec navigation clavier, légende, auteur, date.
- États : progression d'upload par fichier, erreur avec relance, mode lecture seule si le carnet est scellé (`completed_at`) — cohérent avec le rituel existant.

## 3. Écran transversal « Registre visuel »

Nouveau bloc en fin d'étape « J'analyse » (et accessible depuis la synthèse) :
- **Filtres** : type de test (chips colorées par bloc), emplacement (A→E), période (date début / date fin via le Datepicker shadcn), type de média.
- **Vues** : mosaïque chronologique, ou groupée par test / par emplacement (toggle segmenté).
- **Frise temporelle** en tête : chaque upload est un point sur l'axe, survol = aperçu — rend l'historisation lisible d'un coup d'œil.
- Compteurs vivants (« 12 preuves · 3 emplacements · 4 tests ») et export inclus dans l'impression PDF (planche « Preuves de terrain » ajoutée à `CombinedPrintLayout`).

## 4. Direction artistique

Palette existante `--ds-cream / --ds-forest / --ds-gold` étendue d'un accent par bloc (structure = terre, texture = ocre, pH = pourpre/turquoise selon acidité, vie = vert vif), vignettes bordées papier, ombres douces, transitions `framer-motion` en cascade — même grammaire que les cartes actuelles, en plus coloré.

## 5. Détails techniques

- Nouveau hook `usePropertyTestMedias(proprieteId, { block, testId, sampleId })` + mutations upload/patch/delete/reorder, invalidations React Query ciblées.
- Composants : `TestMediaBadge`, `TestMediaDrawer`, `TestMediaGrid`, `TestMediaViewer`, `TestMediaRegistry` (écran filtrable), tous dans `src/components/propriete/analyze/media/`.
- Signature d'URL en lot via un RPC ou `createSignedUrls` (batch) pour éviter N appels.
- Livraison : d'abord le **test du boudin** de bout en bout, puis branchement des 8 autres tests (le composant est générique, c'est une ligne par test).

## Ordre d'exécution
1. Migration (table, RLS, fonction d'accès) + création du bucket privé.
2. Hook + composants médias, branchés sur le test du boudin.
3. Registre visuel filtrable.
4. Extension aux 8 autres tests + planche d'impression.
