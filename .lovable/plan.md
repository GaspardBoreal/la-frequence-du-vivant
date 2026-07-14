## Diagnostic

Sur `/m/:slug` (page Jardin publique), le hook `useGardenFiche` agrège 3 sources de photos :

| Source | Table | Politique SELECT actuelle | Visible anon ? |
|---|---|---|---|
| Officielles curées | `marche_photos` | `USING (true)` pour `public` | ✅ Oui |
| Marcheurs (contributions) | `marcheur_medias` | `TO authenticated` uniquement | ❌ **Non** |
| Convivialité (mur) | `exploration_convivialite_photos` | `TO authenticated` uniquement | ❌ **Non** |

Résultat : un visiteur non connecté ne récupère que le petit lot `marche_photos`. Toute la matière visuelle (photos marcheurs + mur convivialité) est vide → l'événement Jardin paraît sans images. Les utilisateurs connectés (marcheur / admin) voient tout normalement, ce qui correspond exactement au symptôme rapporté.

Vérifié en base :
- `marcheur_medias` : SELECT `((user_id = auth.uid()) OR (is_public = true))` mais restreint à `{authenticated}` → même `is_public = true` est bloqué pour anon.
- `exploration_convivialite_photos` : SELECT dépend de `can_view_exploration_convivialite(auth.uid(), …)` → toujours false pour anon.

Les URLs des fichiers dans Storage sont publiques ; c'est bien la lecture des lignes de métadonnées qui bloque.

## Correctif (une seule migration)

Ajouter des policies **SELECT pour `anon`** strictement scopées aux contenus déjà publics :

### 1. `marcheur_medias` — lecture anon

```sql
CREATE POLICY "Public can view public medias on public events"
ON public.marcheur_medias
FOR SELECT
TO anon
USING (
  is_public = true
  AND EXISTS (
    SELECT 1 FROM public.marche_events me
    WHERE me.id = marcheur_medias.marche_event_id
      AND me.is_public = true
  )
);

GRANT SELECT ON public.marcheur_medias TO anon;
```

Condition : le média est marqué public **et** rattaché à un event lui-même publié (`marche_events.is_public = true`). Aucune fuite sur des marches non publiées.

### 2. `exploration_convivialite_photos` — lecture anon

```sql
CREATE POLICY "Public can view convivialite on public explorations"
ON public.exploration_convivialite_photos
FOR SELECT
TO anon
USING (
  is_hidden = false
  AND EXISTS (
    SELECT 1
    FROM public.explorations e
    JOIN public.marche_events me ON me.exploration_id = e.id
    WHERE e.id = exploration_convivialite_photos.exploration_id
      AND me.is_public = true
  )
);

GRANT SELECT ON public.exploration_convivialite_photos TO anon;
```

Condition : photo non cachée + au moins un event public rattaché à l'exploration. Reflète la logique déjà utilisée par la page publique `/m/:slug`.

## Vérification post-fix

1. En navigation privée (déconnecté), ouvrir `/m/chateau-boutinet-le-vignoble-vivant-2026-09-26` → les visuels marcheurs et le mur convivialité doivent apparaître comme pour un utilisateur connecté.
2. Vérifier qu'un event `is_public = false` n'expose rien (`SELECT` retournant 0 pour anon).
3. Playwright headless : capturer l'écran Jardin section Canopée + Rhizosphère avant/après pour valider visuellement.

## Ce que je ne touche pas

- Aucune modif code React (le bug est 100 % côté data-access).
- Pas de changement sur les policies `authenticated` existantes.
- Pas d'exposition des tables `marche_participations`, `event_invited_readers`, `community_profiles`, etc.
