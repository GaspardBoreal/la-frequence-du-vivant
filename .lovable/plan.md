## Problème

Dans `/admin/proprietes`, le sélecteur « Événements Marches du Vivant » est vide : impossible d'ajouter un événement à une propriété.

## Cause racine (vérifiée en base)

La table `public.marche_events` **n'a pas** de colonnes `nom` ni `date_debut`. Les vraies colonnes sont `title` et `date_marche`.

Or dans `src/pages/AdminProprietes.tsx` :

- La requête `useQuery(['admin-proprietes-events'])` sélectionne `id, nom, date_debut` et fait `.order('date_debut')` → PostgREST renvoie une erreur, `events` reste `[]`, donc rien à choisir.
- Le rendu du `<SelectItem>` et de la liste des liens affichent `e.nom` / `e.date_debut` → même s'il y avait des lignes, l'affichage serait vide.

## Correctif

Un seul fichier concerné : `src/pages/AdminProprietes.tsx`.

1. Type `MarcheEventLite` : remplacer `nom` par `title` et `date_debut` par `date_marche`.
2. Query events : `.select('id, title, date_marche').order('date_marche', { ascending: false })`.
3. Ajouter, comme pour marcheurs/entreprises, un champ de recherche « nom contient » dans le `SelectContent` (filtre local sur `title`, normalisation NFD, `onKeyDown` stopPropagation, état `eventSearch`).
4. Mettre à jour les 2 endroits qui lisent `e.nom` / `e.date_debut` (l'option du Select et la liste `linkedEvents.map(...)`) pour utiliser `title` / `date_marche`.

Aucun changement de schéma, de RLS, ni d'autre écran.

## Vérification

- Ouvrir la fiche d'une propriété existante, dérouler « Événements Marches du Vivant » → la liste affiche les événements avec titre + date FR.
- Taper dans le champ de recherche → filtrage instantané.
- Sélectionner + `+` → l'événement apparaît dans la liste rattachée avec son titre.
