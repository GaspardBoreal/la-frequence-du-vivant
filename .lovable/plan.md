# Filtre « Portrait · Intention » dans l’onglet Table

## Ce qui sera ajouté

Dans le widget de filtres de `/admin/proprietes`, ajouter une liste déroulante **Portrait · Intention** à côté des filtres existants :

- **Toutes** — comportement actuel.
- **À renseigner** — affiche uniquement les jardins sans aucune donnée du parcours d’accueil.
- **Renseignées** — affiche les jardins ayant au moins une information dans `onboarding_preferences`.

L’option attendue pour votre besoin sera donc : **Portrait · Intention : À renseigner**.

## Règle métier

Un jardin sera considéré comme **à renseigner** lorsque :

- `proprietes.onboarding_preferences` est `NULL`, ou
- `proprietes.onboarding_preferences = {}`.

Cela correspond aux données actuelles : 10 jardins au total, dont 4 ont un bloc vide `{}` et aucun n’a `NULL`.

Un jardin ayant commencé le parcours, même sans `completed_at`, restera **renseigné**. Nous ne confondons pas « pas encore renseigné » avec « parcours non terminé ».

## Comportement

- Le filtre s’appliquera à l’onglet **Table**, avec les autres filtres déjà actifs (statut, région, entreprise, GPS, sondes, période…).
- Il sera conservé dans l’URL (`intention=vide` / `intention=renseignee`) pour permettre de partager directement la liste.
- La pagination et le compteur total resteront exacts : le filtrage sera fait côté base, pas seulement sur les lignes affichées.
- Les vues **Carte**, **Tableau de bord** et **Analyse** réutiliseront automatiquement le même filtre si elles sont ouvertes ensuite.
- La réinitialisation remettra ce filtre sur **Toutes** avec les autres.

## Détails techniques

- `src/components/admin/proprietes/types.ts` : ajouter `intention: 'all' | 'vide' | 'renseignee'` aux filtres et à `DEFAULT_FILTERS`.
- `src/components/admin/proprietes/ProprietesFilters.tsx` : ajouter le sélecteur dans la grille, en adaptant la grille responsive si nécessaire.
- `src/pages/AdminProprietes.tsx` : lire le paramètre URL, transmettre la valeur et appliquer le filtre dans `applyFilters` avec une condition JSONB sur `onboarding_preferences`.
- Aucun changement de schéma ni migration nécessaire.

## Vérification

Après implémentation, la sélection **À renseigner** devra afficher exactement les 4 jardins actuellement sans intention, tout en respectant les autres filtres actifs.