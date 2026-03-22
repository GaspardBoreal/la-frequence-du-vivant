

# Section "Prochaines marches" dynamique et immersive

## Concept

Remplacer le calendrier statique code en dur par une requete sur `marche_events` (table deja existante avec `date_marche`, `title`, `description`, `lieu`) filtrant les evenements a venir (`date_marche >= today`), triés par date croissante. L'affichage passe d'une simple timeline a des **cartes immersives** avec :

- Fond gradient individuel par carte avec un effet glassmorphism
- Countdown dynamique ("Dans 6 jours", "Dans 2 mois") affiche en badge
- Icone saisonniere contextuelle (printemps/ete/automne/hiver) basee sur la date
- Animation d'entree en cascade (stagger framer-motion)
- Nom de l'organisateur affiche sous chaque evenement (join sur `marche_organisateurs` via les marches)
- Etat vide elegant si aucun evenement a venir ("Les prochaines marches se preparent...")

## Modifications

### 1. `src/pages/MarchesDuVivantExplorer.tsx`

**Supprimer** le tableau `calendrier` statique (lignes 144-147).

**Ajouter** un fetch des evenements a venir :

```ts
const { data: upcomingEvents = [] } = useQuery({
  queryKey: ['upcoming-marche-events'],
  queryFn: async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('marche_events')
      .select('id, title, description, date_marche, lieu')
      .gte('date_marche', today)
      .order('date_marche', { ascending: true })
      .limit(6);
    return data || [];
  }
});
```

**Remplacer** la section calendrier (lignes 601-638) par des cartes immersives :

- Chaque carte : fond glassmorphism (`bg-white/60 backdrop-blur-sm`), bordure emeraude subtile, ombre diffuse
- Badge countdown en haut a droite ("Dans X jours" / "Dans X semaines")
- Date formatee en francais (`Intl.DateTimeFormat`)
- Icone saisonniere (Sun pour ete, Flower2 pour printemps, Leaf pour automne, Snowflake pour hiver)
- Titre en `font-crimson text-xl`, lieu en `text-emerald-700`, description en `text-stone-500`
- Hover : legere elevation (`hover:-translate-y-1 hover:shadow-xl`)
- Layout : grille responsive `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` au lieu de la timeline verticale
- Etat vide : illustration minimaliste avec message poetique

### 2. Import

Ajouter `useQuery` de `@tanstack/react-query` et `supabase` client.

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `src/pages/MarchesDuVivantExplorer.tsx` | Modifier (fetch dynamique + redesign cartes) |

