

# Table organisateurs + association aux marches

## 1. Migration SQL — Creer la table `marche_organisateurs`

```sql
CREATE TABLE public.marche_organisateurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  adresse text,
  code_postal text,
  ville text,
  pays text DEFAULT 'France',
  email text,
  telephone text,
  site_web text,
  logo_url text,
  description text,
  type_structure text DEFAULT 'association',  -- association, entreprise, collectif, individu
  domaines text[] DEFAULT '{}',               -- ex: ['poesie', 'agroecologie', 'bioacoustique']
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marche_organisateurs ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "Public can view organisateurs"
  ON public.marche_organisateurs FOR SELECT TO public USING (true);

-- Ecriture admin only
CREATE POLICY "Admins can manage organisateurs"
  ON public.marche_organisateurs FOR ALL TO authenticated
  USING (check_is_admin_user(auth.uid()))
  WITH CHECK (check_is_admin_user(auth.uid()));

-- Ajouter colonne organisateur_id sur marches
ALTER TABLE public.marches
  ADD COLUMN organisateur_id uuid REFERENCES public.marche_organisateurs(id);
```

## 2. Insertion des 4 organisateurs initiaux (via insert tool)

```sql
INSERT INTO marche_organisateurs (nom, adresse, code_postal, ville, pays, type_structure, domaines) VALUES
  ('Gaspard Boréal', '4 rue du Champ de Foire', '16190', 'DEVIAT', 'France', 'individu', ARRAY['poesie','bioacoustique','exploration_sonore']),
  ('La Comédie des Mondes Hybrides', '4 rue du Champ de Foire', '16190', 'DEVIAT', 'France', 'association', ARRAY['theatre','narration','mondes_hybrides']),
  ('La Fréquence du Vivant', '4 rue du Champ de Foire', '16190', 'DEVIAT', 'France', 'association', ARRAY['agroecologie','poesie','bioacoustique','data']),
  ('Mouton Village Événements', '1 Place du 25 Août', '79340', 'VASLES', 'France', 'association', ARRAY['transhumance','evenementiel','pastoralisme']);

-- Associer toutes les marches existantes a Gaspard Boreal
UPDATE marches SET organisateur_id = (
  SELECT id FROM marche_organisateurs WHERE nom = 'Gaspard Boréal' LIMIT 1
);
```

## 3. Page admin organisateurs `src/pages/OrganisateursAdmin.tsx`

- Liste des organisateurs avec nom, ville, nombre de marches associees
- Formulaire creation/edition : nom, adresse, cp, ville, pays, type_structure, domaines, email, telephone, site_web
- Suppression avec confirmation

## 4. Selecteur organisateur dans le formulaire marche

- Dans la page `/admin/marches`, ajouter un `<Select>` pour choisir l'organisateur lors de la creation/edition d'une marche

## 5. Routes et navigation

- **`src/App.tsx`** : ajouter route `/admin/organisateurs` → `OrganisateursAdmin`
- **`src/pages/AdminAccess.tsx`** : ajouter carte "Organisateurs" dans le grid admin

## Champs strategiques du modele `domaines`

Le champ `domaines` (array de tags) permet de typer chaque organisateur selon les axes cles de La Frequence du Vivant :
- `poesie` — creation litteraire, narration geopoetique
- `bioacoustique` — ecoute du vivant, paysages sonores
- `agroecologie` — sols, biodiversite, pratiques regeneratives
- `data` — science des donnees appliquee au vivant
- `transhumance` — mobilite, pastoralisme
- `theatre` / `narration` — arts vivants
- `evenementiel` — logistique, accueil
- `education` — formation, transmission

Ce referentiel permet a terme de filtrer les marches par angle thematique et de construire des parcours croises (ex: "marches bioacoustique + agroecologie en Nouvelle-Aquitaine").

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| Migration SQL | Creer table + FK |
| Insert SQL | 4 organisateurs + UPDATE marches |
| `src/pages/OrganisateursAdmin.tsx` | Creer |
| `src/pages/AdminAccess.tsx` | Modifier (carte) |
| `src/App.tsx` | Modifier (route) |
| Formulaire marche (admin) | Modifier (select organisateur) |

