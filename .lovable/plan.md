## Objectif

Ajouter une action « Dupliquer » sur les événements de marche, sûre, prévisible et alignée au design system.

## Périmètre copié (whitelist explicite)

Champs de `marche_events` recopiés :
- `title` (suffixé), `description`, `event_type`
- `lieu`, `latitude`, `longitude`
- `max_participants`
- `exploration_id`

Champs **régénérés / réinitialisés** :
- `id` → nouveau `gen_random_uuid()`
- `qr_code` → nouveau hex (default DB)
- `date_marche` → choisi dans le mini-dialog
- `created_by` → admin courant
- `created_at` / `updated_at` → `now()`

**Jamais copié** (RGPD / intégrité) : participations, médias marcheurs, observations, témoignages, snapshots biodiversité, logs d'activité, audios, textes, backfill iNat.

Note technique : `marche_events` n'a actuellement **pas** de champ `slug`, `is_published`, ni de table de liaison `marche_event ↔ organisateurs`. La case « exploration & organisateurs » se traduit donc uniquement par la recopie de `exploration_id` (les organisateurs sont rattachés aux `marches`, pas aux events).

Pour les **marches rattachées** : il n'existe pas de FK directe `marches.marche_event_id`. Les marches sont liées via `exploration_id`. Aucune marche ne sera donc recréée par défaut — un évènement dupliqué pointera vers la même exploration et héritera de ses marches existantes. (À confirmer : voir « Question ouverte » ci-dessous.)

## UX

### 1. Mini-dialog « Dupliquer cet événement »
Composant `DuplicateEventDialog.tsx` (shadcn `Dialog`), déclenché depuis 2 points d'entrée :

- **Liste** (`EventsListTab`) : ajout d'un menu kebab `⋮` (`DropdownMenu`) en haut-droite de chaque carte, avec actions « Voir », « Éditer », « Dupliquer ». `stopPropagation` pour ne pas déclencher la navigation de la carte.
- **Détail / édition** (`ExplorationMarchesAdmin` ou formulaire d'événement) : bouton secondaire « Dupliquer » dans le header, à côté de « Éditer ».

Contenu du dialog :
- Input `Titre de la copie` (défaut : `"{title} (copie)"`)
- DatePicker shadcn + sélecteur heure (défaut : `date_marche + 7 jours`, même heure)
- Texte d'aide listant ce qui sera **et ne sera pas** copié
- Boutons `Annuler` / `Dupliquer` (loading state)

### 2. Après confirmation
- Insert en base
- Toast succès : « Événement dupliqué »
- Invalidate React Query : `marche-events-paginated`, `marche-events-stats`, `marche-events-all`
- Redirection : `/admin/marche-events/{newId}` (page d'édition) pour ajustement immédiat

### 3. Gestion d'erreur
- Validation Zod côté client (titre non vide, date future ou non, longueur)
- Catch Supabase → toast `destructive` avec message lisible

## Implémentation technique

```text
src/
├─ hooks/useDuplicateMarcheEvent.ts         # mutation react-query
├─ components/admin/marche-events/
│   ├─ DuplicateEventDialog.tsx              # dialog réutilisable
│   └─ EventsListTab.tsx                     # + menu kebab
└─ pages/MarcheEventsAdmin.tsx               # contrôle dialog state (déjà routé)
```

`useDuplicateMarcheEvent` :
```ts
async ({ sourceId, title, dateMarche }) => {
  // 1. SELECT * source
  // 2. Whitelist + override title/date_marche/created_by
  // 3. INSERT (DB régénère id + qr_code)
  // 4. Retour newId
}
```

Pas de migration SQL nécessaire — les RLS d'`INSERT` admin sur `marche_events` existent déjà (vérifier `check_is_admin_user`).

## Design system

- Dialog : composants shadcn (`Dialog`, `Input`, `Popover`+`Calendar` avec `pointer-events-auto`, `Button`)
- Aucune couleur hardcodée — `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`
- Icône `Copy` (lucide) pour les CTA
- Toast via `sonner` (déjà installé)

## Question ouverte (1 dernière clarification)

L'option « Marches rattachées (sans participants ni médias) » que vous avez cochée : voulez-vous que je **crée aussi de nouvelles marches** dans l'exploration cible (copies des marches liées à la date source), ou est-ce que pointer simplement vers la même `exploration_id` suffit ? Étant donné qu'il n'y a pas de FK `marches → marche_events`, dupliquer des marches signifierait les **dupliquer dans l'exploration** (et elles apparaîtraient pour tous les autres events de cette exploration), ce qui est probablement indésirable. Je recommande donc de **ne pas dupliquer les marches** et de garder le lien via `exploration_id` uniquement. Confirmez-vous ?