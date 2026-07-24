## Diagnostic confirmé

- L’extension `unaccent` existe bien, mais elle est installée dans le schéma `extensions`, pas dans `public`.
- Le trigger de génération automatique du slug des propriétés appelle actuellement `unaccent(NEW.nom)` sans préfixe de schéma.
- Comme la fonction `public.trg_propriete_slug()` force `search_path` à `public`, Postgres ne trouve pas `extensions.unaccent(...)`, d’où l’erreur : `function unaccent(text) does not exist`.

## Correction proposée

1. Remplacer la fonction `public.trg_propriete_slug()` pour appeler explicitement :
   - `extensions.unaccent(NEW.nom)`
   - ou mieux `public.f_unaccent(NEW.nom)` si on veut s’appuyer sur le wrapper déjà existant.

2. Garder le trigger existant `trg_proprietes_slug` inchangé : seule sa fonction appelée doit être corrigée.

3. Vérifier après migration :
   - que la fonction compile,
   - que `extensions.unaccent('École Vivante')` fonctionne,
   - que le trigger utilise bien la nouvelle définition qualifiée,
   - puis tester une insertion de propriété avec accents via la vraie table ou un test transactionnel contrôlé.

## Migration SQL prévue

```sql
CREATE OR REPLACE FUNCTION public.trg_propriete_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_base TEXT;
  v_slug TEXT;
  v_suffix INT := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;

  v_base := regexp_replace(
    lower(extensions.unaccent(NEW.nom)),
    '[^a-z0-9]+',
    '-',
    'g'
  );
  v_base := trim(both '-' from v_base);

  IF v_base = '' THEN
    v_base := 'propriete';
  END IF;

  v_slug := v_base;
  WHILE EXISTS (
    SELECT 1
    FROM public.proprietes
    WHERE slug = v_slug
      AND id <> COALESCE(NEW.id, gen_random_uuid())
  ) LOOP
    v_suffix := v_suffix + 1;
    v_slug := v_base || '-' || v_suffix;
  END LOOP;

  NEW.slug := v_slug;
  RETURN NEW;
END;
$$;
```

## Impact

- Corrige directement la création de propriété depuis l’admin.
- Ne modifie pas les données existantes.
- Ne change pas les règles RLS.
- Ne crée pas de nouvelle table.