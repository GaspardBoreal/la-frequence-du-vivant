# Un moteur de recherche des pages publiques, sur tout le site

## Ce que vous obtenez

Une loupe dans le bandeau du haut, présente sur toutes les pages publiques, plus le raccourci clavier ⌘K / Ctrl+K. Elle ouvre une fenêtre plein écran, sombre et végétale (même écriture visuelle que la recherche déjà existante) qui propose les pages du site au fil de la frappe.

Les résultats sont toujours groupés dans cet ordre, chaque univers avec sa couleur et son icône :

1. Fréquence Jardin
2. Fréquence du Vignoble
3. Les Marches du Vivant
4. Éco tourisme
5. La Fréquence du Vivant (tout le reste)

Détails d'expérience : navigation entièrement au clavier (flèches, Entrée, Échap), première suggestion pré-sélectionnée, mots recherchés surlignés, tolérance aux accents et aux fautes légères, recherches récentes, et un état de départ inspirant qui présente les cinq univers avec deux ou trois pages phares chacun — la recherche devient aussi une carte du site.

## L'écran d'administration des règles

Une nouvelle page `/admin/outils/recherche` où vous pilotez tout, sans passer par moi :

- **Pages** : titre, sous-titre, adresse, univers, mots-clés, priorité, page mise en avant, visible ou non.
- **Règles de classement** : liste ordonnée de règles « si l'adresse commence par… » ou « si le titre/les mots-clés contiennent… » → univers X. Elles servent à classer automatiquement les nouvelles pages.
- **Aperçu immédiat** : un champ de test montre, en direct, ce que verrait un visiteur pour une requête donnée.
- **Alimentation initiale** : un bouton « Recenser les pages » propose les pages publiques du site que je pré-remplis, vous validez ou corrigez.
- Les pages d'administration, de connexion et les espaces privés sont exclus.

Règles de départ pour le Vignoble, selon vos mots : `viti`, `vini`, `château`, `vignoble`, `vin`.

## Détails techniques

- Table `site_pages` (path unique, title, subtitle, univers, keywords[], priority, featured, is_active) et table `site_search_rules` (ordre, type de test, motif, univers cible, actif). Lecture publique via `GRANT SELECT ... TO anon, authenticated` + politiques RLS lecture seule ; écriture réservée aux admins via `has_role(auth.uid(),'admin')`, plus `GRANT ALL ... TO service_role`.
- Classement : la valeur `univers` saisie sur une page l'emporte ; sinon la première règle correspondante ; sinon « La Fréquence du Vivant ».
- Recherche côté client : le catalogue (quelques centaines de lignes au plus) est chargé une fois via React Query et mis en cache, puis filtré en mémoire — normalisation NFD sans accents, correspondance sur titre, sous-titre, adresse et mots-clés, score = exactitude + priorité + mise en avant. Aucune requête réseau à chaque frappe.
- Nouveaux fichiers : `src/lib/search/siteSearch.ts` (normalisation, score, application des règles), `src/hooks/useSitePages.ts`, `src/components/search/SitePagesSearchOverlay.tsx`, `src/components/search/SiteSearchTrigger.tsx`, page admin `src/pages/AdminRecherche.tsx` avec ses composants d'édition.
- Intégration : déclencheur ajouté dans `PublicTopBar.tsx`, et un montage global au niveau de l'application pour que ⌘K fonctionne sur les pages qui n'utilisent pas encore ce bandeau. La recherche existante de l'espace marcheur (espèces, textes, marcheurs) reste inchangée et intacte.
- Journalisation des requêtes réutilisant `log_search` avec `scope = 'site'`, pour que vous voyiez plus tard ce que les visiteurs cherchent.
