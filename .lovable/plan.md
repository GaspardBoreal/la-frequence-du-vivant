
Objectif : corriger l’erreur actuelle `Impossible de générer le lien d’invitation : column reference "generated_count" is ambiguous` qui bloque encore les boutons “Copier le lien” et “Partager”.

1. Diagnostic confirmé
- Le frontend n’est plus la cause principale : `MarcheursTab.tsx` remonte maintenant l’erreur SQL réelle.
- Les deux boutons cassent car ils appellent tous deux le même RPC `generate_community_affiliate_link`.
- Dans la dernière version SQL, la fonction est déclarée avec `RETURNS TABLE(link_id, share_token, generated_count)`.
- En PL/pgSQL, `generated_count` devient alors aussi une variable de sortie dans la fonction.
- La ligne `SET generated_count = generated_count + 1` devient ambiguë entre :
  - la colonne `community_affiliate_links.generated_count`
  - la variable de sortie `generated_count`
- C’est donc un bug SQL résiduel dans la fonction, pas un bug d’URL ni de bouton.

2. Correction à appliquer
- Ajouter une nouvelle migration Supabase qui redéfinit uniquement `public.generate_community_affiliate_link`.
- Conserver la logique robuste récente :
  - validation auth / params
  - verrou advisory
  - récupération / création atomique du lien
  - incrément des compteurs
  - insertion des événements
- Corriger explicitement toutes les références ambiguës en qualifiant les colonnes avec un alias de table, par exemple :
  - `SET generated_count = l.generated_count + 1`
  - `SET button_click_count = l.button_click_count + 1`
- Rendre aussi le `RETURN QUERY` explicite et lisible :
  - `SELECT existing_link.id AS link_id, existing_link.share_token AS share_token, existing_link.generated_count AS generated_count`

3. Ce que je ne changerais pas
- Pas besoin de modifier `MarcheursTab.tsx` pour ce bug précis : il aide déjà au diagnostic en affichant l’erreur exacte.
- Pas besoin de toucher `record_community_affiliate_event` pour cette erreur précise, sauf si un nouveau symptôme apparaît après ce fix.
- Ne pas réécrire les anciennes migrations historiques : ajouter une migration corrective propre au-dessus.

4. Fichier impacté
- `supabase/migrations/...` nouvelle migration corrective pour `generate_community_affiliate_link`

5. Vérifications après correctif
- Cliquer “Copier le lien” depuis la vue Marcheurs :
  - plus d’erreur SQL
  - texte copié correctement
  - compteur `generated_count` incrémenté
- Cliquer “Partager” :
  - plus d’erreur SQL
  - ouverture du partage natif ou fallback clipboard
  - compteur `generated_count` incrémenté
- Vérifier en base que :
  - la ligne `community_affiliate_links` est créée ou réutilisée
  - `button_click_count` et `generated_count` évoluent correctement
  - les événements `button_click` et `link_generated` continuent d’être insérés

6. Détail technique
- Cause exacte : collision de nom entre une variable de sortie PL/pgSQL (`generated_count`) et une colonne SQL du même nom.
- Solution fiable : toujours qualifier les colonnes de compteur dans les `UPDATE` / `SELECT` internes de la fonction lorsqu’un `RETURNS TABLE(...)` expose un nom identique.
