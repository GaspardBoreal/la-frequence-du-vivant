# Diagnostic

Les deux symptômes (« Aucune marche associée » et « Aucun participant validé ») viennent d'**une seule cause** : la fonction SQL `get_curation_media_context` référence la colonne `community_profiles.display_name` qui **n'existe pas** dans la table (les colonnes réelles sont `prenom` / `nom` / `slug`).

Conséquence : la RPC lève une exception, le hook `useCurationMediaContext` renvoie `null`, et le drawer affiche ses placeholders par défaut :
- pas de marche → « Aucune marche associée »
- pas de GPS → « Aucune coordonnée »
- pas de candidats → « Aucun participant validé sur cet événement »

(Les suggestions IA, elles, viennent d'un autre hook — `useAiCurationMedias` — donc elles s'affichent correctement, ce qui masquait la panne.)

Vérification base de données pour la photo « Ail des ours » ouverte :
- `marche_id` = Prairie humide ✅
- GPS EXIF présent (48.828577, 0.019497, alt 0) ✅
- Vincent Levavasseur a bien `validated_at` sur l'événement ✅

Donc dès que la RPC est réparée, les 3 blocs se rempliront correctement.

# Correction (migration unique)

Recréer `get_curation_media_context` avec deux ajustements :

1. **Remplacer `cp.display_name`** par `COALESCE(NULLIF(TRIM(cp.prenom||' '||cp.nom),''), cp.slug, '')` dans les deux endroits :
   - bloc `candidates` (liste des participants validés)
   - bloc `attributed` (marcheur déjà attribué)

2. **Inclure l'uploader original** dans `candidates` même s'il n'a pas de `marche_participations` validée — sécurité supplémentaire (ici Vincent est validé donc ça ne change rien, mais évite la régression sur d'autres events). Implémentation : `UNION` avec `SELECT m.user_id FROM marcheur_medias m WHERE m.id = p_media_id`, dédupliqué.

Aucune modification frontend ni edge function nécessaire — la signature et la forme JSONB restent identiques.

# Validation

Après migration, recharger la carte de curation et cliquer sur le point « Ail des ours » :
- Bloc MARCHE → « Prairie humide » + distance au centre + mini-carte
- Bloc GPS EXACT → 48.828577 / 0.019497 (EXIF)
- Bloc MARCHEUR ATTRIBUÉ → dropdown avec Vincent Levavasseur et Gaspard Boréal
- Bloc IMPACT → préviewra « créera espèce Allium ursinum dans Prairie humide »
