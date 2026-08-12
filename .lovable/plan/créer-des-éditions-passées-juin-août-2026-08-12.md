# Créer des éditions passées (juin → août)

Aujourd'hui l'atelier ne propose que le bouton « Semaine en cours » : impossible de reconstituer un historique. On ajoute deux façons de créer des semaines antérieures.

## A. Créer une semaine à une date choisie

À côté de « Semaine en cours », un bouton **« Autre semaine… »** ouvre un petit sélecteur :

```text
Choisir une date  [ 17 juin 2026 ]   →  Semaine 25 · 2026 (15 → 21 juin)   [ Créer ]
```

- On choisit n'importe quelle date dans un calendrier ; l'application en déduit le numéro de semaine ISO et les bornes lundi → dimanche.
- Si l'édition existe déjà, elle est simplement sélectionnée au lieu d'être dupliquée.
- L'édition est créée en **brouillon** : rien n'apparaît en public tant que vous ne la publiez pas.

## B. Reconstituer une période entière d'un coup

Dans le même sélecteur, un second mode **« Période »** :

```text
Du [ 1 juin 2026 ]  au [ 31 août 2026 ]      → 13 semaines seront créées   [ Générer ]
```

- Crée en une fois toutes les semaines manquantes de l'intervalle, en brouillon, titrées « Semaine N » et rangées dans la colonne de gauche de la plus récente à la plus ancienne.
- Les semaines déjà existantes sont ignorées (aucun écrasement de contenu).
- Un message de fin indique le nombre créé et le nombre ignoré.

Vous n'avez ensuite plus qu'à ouvrir chaque semaine, coller vos notes de la période, lancer « Relever l'activité réelle » (qui interroge la base sur les bornes de cette semaine-là, donc bien sur juin/juillet/août) puis « Composer les nouveautés », et publier les semaines une par une quand elles vous conviennent.

## Repère visuel

Dans la liste de gauche, les brouillons anciens restent identifiables : badge « Brouillon », et un discret marqueur **« rétrospective »** sur les semaines créées après coup, pour distinguer d'un coup d'œil ce qui reste à documenter.

## Détails techniques

- `src/lib/roadmap/types.ts` : ajout de `isoWeeksBetween(from, to)` renvoyant la liste `{ isoYear, isoWeek, startsOn, endsOn }` de toutes les semaines ISO couvrant l'intervalle (réutilise `isoWeekInfo`).
- `src/components/roadmap/admin/CreateWeekDialog.tsx` (nouveau) : `Dialog` shadcn, deux onglets « Une semaine » / « Période », `Calendar` + `Popover` pour les dates, aperçu du numéro ISO et du nombre de semaines, appel de `upsertWeek` en boucle séquentielle, `toast` de bilan.
- `src/pages/AdminRoadmap.tsx` : bouton « Autre semaine… » ouvrant le dialogue ; `onCreated(weekId)` sélectionne la semaine créée (ou la dernière du lot).
- Le `upsert` sur `roadmap_weeks` conserve `onConflict: 'iso_year,iso_week'` — pour la génération de période on filtre en amont sur les semaines déjà présentes afin de ne rien écraser.
- Aucune migration : le schéma actuel suffit (`starts_on` / `ends_on` acceptent n'importe quelle date passée). Le marqueur « rétrospective » est purement déduit à l'affichage (semaine dont les bornes sont antérieures à la semaine en cours et statut `draft`).
