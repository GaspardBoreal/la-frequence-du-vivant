

# Migration des citations + Hub Outils Admin

## 1. Table Supabase `frequence_citations`

Creer une table pour stocker les citations dynamiquement :

```sql
CREATE TABLE public.frequence_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  texte TEXT NOT NULL,
  auteur TEXT NOT NULL,
  oeuvre TEXT NOT NULL,
  url TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.frequence_citations ENABLE ROW LEVEL SECURITY;

-- Lecture publique (les citations sont affichees a tous les utilisateurs connectes)
CREATE POLICY "Anyone can read active citations"
  ON public.frequence_citations FOR SELECT
  USING (active = true);

-- Seuls les admins peuvent inserer/modifier/supprimer
CREATE POLICY "Admins can manage citations"
  ON public.frequence_citations FOR ALL
  TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));
```

Ensuite, inserer les 24 citations existantes depuis `FrequenceWave.tsx` via INSERT.

## 2. Modifier `FrequenceWave.tsx`

- Supprimer le tableau `CITATIONS` en dur
- Charger les citations depuis Supabase (`frequence_citations`)
- Garder la logique de selection par jour (`seed % count`)
- Fallback sur une citation par defaut si le fetch echoue

## 3. Carte "Outils" dans `AdminAccess.tsx`

Ajouter une nouvelle carte dans la grille admin avec icone `Wrench` pointant vers `/admin/outils`.

## 4. Page `/admin/outils` (AdminOutilsHub)

Page hub listant les outils admin disponibles sous forme de cartes :
- **Ma Frequence du jour** → `/admin/outils/frequences`
- **Zones** → `/admin/outils/zones` (placeholder)
- **Quiz** → `/admin/outils/quizz` (placeholder)

## 5. Page `/admin/outils/frequences` (AdminFrequences)

Liste des citations avec :
- **En-tete** : compteur total de citations + champ de recherche "mot contenant" filtrant sur tous les champs (texte, auteur, oeuvre, url)
- **Tableau** : colonnes auteur, oeuvre, url (lien cliquable), texte
- **Actions** : modifier / supprimer chaque citation, bouton ajouter
- Structure prevue pour accueillir d'autres fonctionnalites a terme (layout avec sidebar ou tabs)

## 6. Routes dans `App.tsx`

Ajouter 2 routes protegees par `AdminAuth` :
- `/admin/outils` → `AdminOutilsHub`
- `/admin/outils/frequences` → `AdminFrequences`

## Fichiers impactes

| Fichier | Action |
|---|---|
| Migration SQL | Table `frequence_citations` + seed 24 citations |
| `src/components/community/FrequenceWave.tsx` | Fetch Supabase au lieu du tableau en dur |
| `src/pages/AdminAccess.tsx` | Nouvelle carte "Outils" |
| `src/pages/AdminOutilsHub.tsx` | Nouveau — hub outils admin |
| `src/pages/AdminFrequences.tsx` | Nouveau — CRUD citations avec filtre + compteur |
| `src/App.tsx` | 2 nouvelles routes admin |

