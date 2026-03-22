

# Inserer les evenements a venir dans `marche_events`

## Diagnostic

La table `marche_events` est vide. Le code dynamique fait une requete `SELECT ... WHERE date_marche >= today` qui retourne 0 lignes, d'ou l'affichage de l'etat vide.

## Solution

Inserer les 3 evenements du calendrier 2026 via une migration SQL :

```sql
INSERT INTO marche_events (title, description, date_marche, lieu) VALUES
  ('La transhumance de Mouton Village édition 2026',
   'Deux jours de randonnée et de convivialité en bonne compagnie : moutons, chiens de berger, ânes, chevaux (Vouillé dans la Vienne vers Mouton Village dans les Deux-Sèvres)',
   '2026-03-28', 'Vouillé (Vienne) → Mouton Village (Deux-Sèvres)'),
  ('Le Réveil de la Terre : Marcher sur un sol qui respire',
   'Lieu (DEVIAT - Charente)',
   '2026-04-11', 'DEVIAT - Charente'),
  ('Les Arbres Gardiens : De l''ombre et de l''eau pour nos champs',
   'Lors de la fête de la nature (Dordogne)',
   '2026-05-24', 'Dordogne');
```

## Fichier concerne

| Fichier | Action |
|---------|--------|
| Migration SQL | Insert 3 evenements dans `marche_events` |

Aucune modification de code necessaire — le fetch dynamique existant affichera automatiquement les evenements une fois inseres.

