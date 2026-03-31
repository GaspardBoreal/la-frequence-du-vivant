

# Analytique des citations — compteurs + filtres admin

## 1. Migration : 2 colonnes sur `frequence_citations`

```sql
ALTER TABLE public.frequence_citations
  ADD COLUMN shown_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN viewed_count INTEGER NOT NULL DEFAULT 0;
```

- `shown_count` : incrémenté chaque fois que la citation est sélectionnée comme "fréquence du jour" (affichée dans le widget FrequenceWave)
- `viewed_count` : incrémenté chaque fois qu'un marcheur connecté voit effectivement la citation (composant monté)

Pas besoin de fonction RPC : on utilise un simple `UPDATE ... SET shown_count = shown_count + 1` via le client Supabase. La politique RLS existante autorise déjà la lecture publique ; on ajoute une politique `UPDATE` limitée aux colonnes compteurs pour les utilisateurs authentifiés.

**Politique RLS pour l'incrément** :
```sql
CREATE POLICY "Authenticated users can increment counters"
ON public.frequence_citations FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);
```
(La colonne `active` et les autres champs restent protégés par le code front qui ne les modifie pas dans ce contexte.)

## 2. FrequenceWave : incrémenter `viewed_count`

Dans `FrequenceWave.tsx`, après sélection de la citation du jour, ajouter un `useEffect` qui incrémente `viewed_count` une seule fois par session/jour :

- Stocker en `sessionStorage` l'id de la dernière citation vue
- Si la citation du jour change (nouveau jour) ou n'a pas encore été comptée, appeler :
  ```ts
  supabase.from('frequence_citations')
    .update({ viewed_count: citation.viewed_count + 1 })
    .eq('id', citation.id)
  ```
- Nécessite de récupérer `id` et `viewed_count` dans la query existante

Pour `shown_count` : incrémenter dans le même effet (la citation "montrée" = la citation "vue", car le widget est le seul point d'affichage). Alternativement, on peut séparer les deux si on veut distinguer "rendue côté client" vs "lue activement", mais pour la V1 un seul incrément suffit avec `shown_count` = nombre de jours où cette citation a été la fréquence du jour, et `viewed_count` = nombre total de vues par des marcheurs.

**Logique retenue** :
- `shown_count` : +1 par jour calendaire où cette citation est la fréquence du jour (via un check `localStorage` par jour)
- `viewed_count` : +1 par marcheur connecté qui voit le widget (via `sessionStorage` pour dédupliquer par session)

## 3. Admin UI : filtres et tri

Dans `AdminFrequences.tsx` :

**Nouveaux états** :
```ts
const [shownFilter, setShownFilter] = useState<'all' | 'shown' | 'not_shown'>('all');
const [sortBy, setSortBy] = useState<'viewed_desc' | 'viewed_asc'>('viewed_desc');
```

**Barre de filtres** (dans la Card header existante, sous la barre de recherche) :
- Filtre "Déjà Montré" : 3 boutons toggle compacts (Tous / Oui / Non)
- Tri par consultations : bouton toggle croissant/décroissant avec icône flèche

**Colonnes tableau** : ajouter 2 colonnes compactes :
- "Montré" : affiche `shown_count` avec une pastille visuelle (vert si > 0, gris sinon)
- "Vues" : affiche `viewed_count` avec un mini-badge numérique

**Filtrage côté client** :
```ts
filtered = filtered.filter(c => {
  if (shownFilter === 'shown') return c.shown_count > 0;
  if (shownFilter === 'not_shown') return c.shown_count === 0;
  return true;
});
filtered.sort((a, b) => sortBy === 'viewed_desc' 
  ? b.viewed_count - a.viewed_count 
  : a.viewed_count - b.viewed_count);
```

## Fichiers impactés

| Fichier | Action |
|---|---|
| Migration SQL | `ALTER TABLE` + politique RLS UPDATE |
| `src/components/community/FrequenceWave.tsx` | Fetch `id` + compteurs, incrémenter à l'affichage |
| `src/pages/AdminFrequences.tsx` | Filtres, tri, colonnes compteurs |

