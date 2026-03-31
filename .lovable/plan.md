
Objectif : corriger définitivement les 2 boutons “Copier le lien” et “Partager”, qui échouent encore avec le toast “Impossible de générer le lien d’invitation”.

1. Cause racine identifiée
- Le frontend masque l’erreur réelle : dans `MarcheursTab.tsx`, toute erreur RPC retourne seulement le toast générique.
- La base montre que le système n’est pas totalement absent : `community_affiliate_links` contient déjà des lignes, donc l’architecture existe.
- En revanche, un bug SQL est confirmé dans `record_community_affiliate_event` :
  - `ON CONFLICT ON CONSTRAINT idx_community_affiliate_events_unique_account_created`
  - `idx_...` est un index, pas une contrainte.
  - Cette fonction est donc cassée pour le tracking d’événements.
- Pour la génération de lien, la fonction `generate_community_affiliate_link` est fragile :
  - logique en 2 temps `SELECT -> INSERT/UPDATE`
  - pas de stratégie atomique
  - si un cas de concurrence / duplication / état partiel survient, le RPC peut planter et le frontend ne donne aucun détail.

2. Correction à appliquer
A. Base Supabase
- Corriger `record_community_affiliate_event` pour utiliser un vrai `ON CONFLICT` valide, ou une logique conditionnelle explicite pour `account_created`.
- Réécrire `generate_community_affiliate_link` de façon robuste :
  - validation claire des paramètres
  - génération/récupération du lien en mode atomique
  - mise à jour fiable des compteurs
  - insertion des événements `button_click` et `link_generated` sans risque de collision
- Conserver les mêmes tables et la même intention fonctionnelle, sans changer l’UX métier.

B. Frontend
- Dans `src/components/community/exploration/MarcheursTab.tsx` :
  - afficher l’erreur réelle `error.message` pendant le correctif, au lieu du toast générique seul
  - séparer clairement :
    1. échec de génération du lien
    2. échec du presse-papier
    3. échec du partage natif
- Garder les deux comportements distincts :
  - `Copier le lien` = message long + URL trackée
  - `Partager` = kit partage + partage natif/fallback

3. Détail du correctif frontend
- `createAffiliateLink()` :
  - garder la vérification d’auth
  - appeler le RPC
  - si erreur RPC : afficher le détail exact et logguer côté console
  - si `data` vide : gérer explicitement ce cas
- `handleCopyLink()` :
  - entourer `navigator.clipboard.writeText(...)` d’un `try/catch`
  - toast spécifique si le presse-papier échoue
- `handleShare()` :
  - ne pas confondre un refus natif de partage avec une erreur de génération
  - fallback propre vers copie du message si `navigator.share` n’aboutit pas

4. Détail du correctif SQL
- Remplacer le `ON CONFLICT ON CONSTRAINT idx_community_affiliate_events_unique_account_created` par une version valide.
- Sécuriser `generate_community_affiliate_link` pour qu’il ne dépende plus d’un `SELECT` préalable fragile.
- Vérifier que la fonction retourne toujours une ligne avec :
  - `link_id`
  - `share_token`
  - `generated_count`

5. Résultat attendu après correction
- “Copier le lien” fonctionne à chaque clic
- “Partager” fonctionne à chaque clic
- plus aucun toast “Impossible...” tant que l’utilisateur est connecté et que l’exploration existe
- le tracking continue de compter :
  - clics bouton
  - liens générés
  - vues landing
  - comptes créés

6. Fichiers impactés
- `src/components/community/exploration/MarcheursTab.tsx`
- `supabase/migrations/...` nouvelle migration de correction des fonctions :
  - `generate_community_affiliate_link`
  - `record_community_affiliate_event`

7. Note importante
Le bug n’est pas dans l’URL générée elle-même. Le problème est bien dans la couche RPC/SQL + dans le fait que le frontend masque l’erreur exacte, ce qui a rendu le diagnostic plus lent.

8. Ordre d’implémentation
1. Corriger la migration SQL des fonctions
2. Mettre à jour `MarcheursTab.tsx` pour remonter les vraies erreurs et distinguer RPC / clipboard / share
3. Re-tester les 2 boutons depuis la vue Marcheurs sur l’exploration actuelle
4. Vérifier ensuite la landing publique et le tracking d’inscription