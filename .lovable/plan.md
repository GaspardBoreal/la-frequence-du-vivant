

# Associer les contributions aux marches (etapes), pas a l'evenement

## Diagnostic confirme

Les 3 tables `marcheur_medias`, `marcheur_audio`, `marcheur_textes` n'ont qu'une colonne `marche_event_id`. Quand le marcheur uploade une photo sur l'etape 1, elle est stockee avec l'ID de l'evenement global. Resultat : les deux etapes affichent les memes medias.

## Solution

### Etape 1 : Migration SQL

Ajouter une colonne `marche_id` (UUID, nullable, reference `marches.id`) aux 3 tables de contributions. Nullable pour ne pas casser les donnees existantes.

```sql
ALTER TABLE marcheur_medias ADD COLUMN marche_id UUID REFERENCES marches(id);
ALTER TABLE marcheur_audio ADD COLUMN marche_id UUID REFERENCES marches(id);
ALTER TABLE marcheur_textes ADD COLUMN marche_id UUID REFERENCES marches(id);
```

### Etape 2 : Hook `useMarcheurContributions.ts`

- **Queries** : filtrer par `marche_id` quand il est fourni, sinon fallback sur `marche_event_id` (retrocompatibilite)
- **Mutations** (upload, create) : accepter et stocker `marcheId` en plus de `marcheEventId`
- **Stats** : compter par `marche_id` quand disponible

### Etape 3 : `MarcheDetailModal.tsx`

- `VoirTab` et `EcouterTab` : passer `activeMarcheId` aux hooks de contributions au lieu de seulement `marcheEventId`
- `LireTab` : idem, recevoir et utiliser `marcheId`
- Uploads : inclure `marcheId: activeMarcheId` dans les appels de mutation
- Stats (badges) : passer `activeMarcheId` pour que les compteurs refletent l'etape active

## Fichiers modifies

| Fichier | Changement |
|---------|-----------|
| Migration SQL | Ajouter `marche_id` aux 3 tables |
| `src/hooks/useMarcheurContributions.ts` | Ajouter parametre `marcheId` aux queries et mutations, filtrer par `marche_id` en priorite |
| `src/components/community/MarcheDetailModal.tsx` | Passer `activeMarcheId` aux hooks de contributions dans VoirTab, EcouterTab, LireTab ; inclure dans les uploads |

## Retrocompatibilite

Les contributions existantes (sans `marche_id`) resteront visibles via le fallback `marche_event_id`. Les nouvelles contributions seront associees a la marche specifique.

