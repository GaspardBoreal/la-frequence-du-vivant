

## Objectif

Permettre la **publication d'un ePUB Pro sur une URL publique** afin de le partager avec la communauté des lecteurs de Gaspard Boréal, au lieu du téléchargement local uniquement.

---

## Analyse de l'existant

| Élément | État actuel |
|---------|-------------|
| Génération ePUB | Client-side via `epub-gen-memory`, retourne un `Blob` |
| Téléchargement | `file-saver` déclenche un download local |
| Stockage Supabase | Buckets existants : `marche-photos`, `marche-videos`, `marche-audio`, `etudes-pdf`, `documents-annexes` |
| Table exports | `export_keywords` pour mots-clés, mais **aucune table pour les exports publiés** |
| URLs publiques | Pattern établi : `/lecteurs/exploration/:slug/...` pour le contenu progressif |

---

## Architecture proposée

```text
┌──────────────────────────────────────────────────────────────────────┐
│                        ADMIN - Export Panel                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐    │
│  │  Générer     │ →  │  Télécharger │    │  Publier & Partager  │    │
│  │  (existant)  │    │  (existant)  │    │  (NOUVEAU)           │    │
│  └──────────────┘    └──────────────┘    └──────────────────────┘    │
│                                                    │                 │
│                                                    ▼                 │
│                                          ┌─────────────────┐         │
│                                          │ Upload Storage  │         │
│                                          │ public-exports  │         │
│                                          └────────┬────────┘         │
│                                                   │                  │
│                                                   ▼                  │
│                                          ┌─────────────────┐         │
│                                          │ Insert DB       │         │
│                                          │ published_exports│        │
│                                          └────────┬────────┘         │
│                                                   │                  │
└───────────────────────────────────────────────────│──────────────────┘
                                                    │
                                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      PUBLIC - Lien partageable                       │
│                                                                      │
│   https://la-frequence-du-vivant.lovable.app/epub/{unique-slug}     │
│                                                                      │
│   → Affiche : Couverture + Titre + Description + Bouton Télécharger │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Modifications techniques

### 1. Création d'un bucket Supabase `public-exports`

**Migration SQL** : `supabase/migrations/xxx_create_public_exports_bucket.sql`

- Bucket public pour stocker les fichiers ePUB et PDF générés
- Politique RLS : lecture publique, écriture réservée aux admins authentifiés

```text
-- Créer le bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('public-exports', 'public-exports', true);

-- Politique de lecture publique
CREATE POLICY "Public can read exports"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-exports');

-- Politique d'écriture admin
CREATE POLICY "Authenticated admins can upload exports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'public-exports' 
  AND auth.role() = 'authenticated'
  AND public.check_is_admin_user(auth.uid())
);
```

### 2. Création de la table `published_exports`

**Migration SQL** : même fichier migration

```text
CREATE TABLE public.published_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifiant unique pour URL publique
  slug text UNIQUE NOT NULL,
  
  -- Lien avec exploration (optionnel)
  exploration_id uuid REFERENCES explorations(id),
  
  -- Métadonnées affichées
  title text NOT NULL,
  subtitle text,
  description text,
  author text DEFAULT 'Gaspard Boréal',
  cover_url text,
  
  -- Fichier stocké
  file_url text NOT NULL,
  file_size_bytes bigint,
  file_type text DEFAULT 'epub',  -- 'epub' | 'pdf'
  
  -- Direction artistique utilisée
  artistic_direction text,  -- 'galerie_fleuve' | 'dordonia' | etc.
  
  -- Stats
  download_count integer DEFAULT 0,
  
  -- Dates
  published_at timestamptz DEFAULT now(),
  expires_at timestamptz,  -- NULL = permanent
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE published_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published exports"
ON published_exports FOR SELECT USING (true);

CREATE POLICY "Admins can manage exports"
ON published_exports FOR ALL
USING (public.check_is_admin_user(auth.uid()));

-- Index pour lookup par slug
CREATE INDEX idx_published_exports_slug ON published_exports(slug);
```

### 3. Fonction utilitaire `uploadPublicExport`

**Fichier** : `src/utils/publicExportUtils.ts` (nouveau)

```text
export interface PublishExportOptions {
  blob: Blob;
  title: string;
  subtitle?: string;
  description?: string;
  author?: string;
  coverUrl?: string;
  explorationId?: string;
  artisticDirection?: string;
  fileType: 'epub' | 'pdf';
}

export interface PublishedExport {
  id: string;
  slug: string;
  publicUrl: string;
  fileUrl: string;
}

export const publishExport = async (options: PublishExportOptions): Promise<PublishedExport>
```

Logique :
1. Générer un slug unique (ex: `frequences-dordogne-2025-a3f7`)
2. Upload le Blob vers `public-exports/{slug}.epub`
3. Récupérer l'URL publique Storage
4. Insérer dans `published_exports`
5. Retourner l'URL de partage

### 4. Page publique de téléchargement

**Route** : `/epub/:slug`

**Fichier** : `src/pages/PublicEpubDownload.tsx` (nouveau)

Page élégante avec :
- Image de couverture (si disponible)
- Titre et sous-titre
- Description (quatrième de couverture)
- Direction artistique (badge visuel)
- Bouton "Télécharger l'ePUB"
- Compteur de téléchargements (optionnel)
- Lien vers l'exploration complète

Design cohérent avec l'identité "Gaspard Boréal" (émeraude, forêt, typographie éditoriale).

### 5. Modification de `EpubExportPanel.tsx`

**Ajouts UI** :
- Nouveau bouton "Publier & Partager" à côté de "Générer l'EPUB"
- Modal de confirmation avec aperçu du lien généré
- Copie du lien dans le presse-papiers
- Historique des exports publiés (collapsible section)

**États** :
```text
const [publishing, setPublishing] = useState(false);
const [publishedExports, setPublishedExports] = useState<PublishedExport[]>([]);
const [showPublishModal, setShowPublishModal] = useState(false);
const [lastPublishedUrl, setLastPublishedUrl] = useState<string | null>(null);
```

**Nouveau handler** :
```text
const handlePublishAndShare = async () => {
  setPublishing(true);
  const { blob } = await exportToEpub(textes, options);
  const published = await publishExport({
    blob,
    title: options.title,
    subtitle: options.subtitle,
    description: options.description,
    coverUrl: options.coverImageUrl,
    artisticDirection: options.format,
    fileType: 'epub',
  });
  setLastPublishedUrl(published.publicUrl);
  setShowPublishModal(true);
  setPublishing(false);
};
```

### 6. Mise à jour du Router

**Fichier** : `src/App.tsx` (ou routes config)

```text
<Route path="/epub/:slug" element={<PublicEpubDownload />} />
```

---

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `supabase/migrations/xxx_create_public_exports.sql` | CRÉER - bucket + table |
| `src/utils/publicExportUtils.ts` | CRÉER - logique publication |
| `src/pages/PublicEpubDownload.tsx` | CRÉER - page publique |
| `src/components/admin/EpubExportPanel.tsx` | MODIFIER - ajouter bouton Publier |
| `src/App.tsx` | MODIFIER - ajouter route /epub/:slug |
| `src/integrations/supabase/types.ts` | AUTO-GÉNÉRÉ après migration |

---

## URL finale générée

Format : `https://la-frequence-du-vivant.lovable.app/epub/{slug}`

Exemple : `https://la-frequence-du-vivant.lovable.app/epub/frequences-dordogne-galerie-fleuve-2025`

---

## Avantages

1. **Partage simplifié** : Un lien unique à envoyer à la communauté
2. **Expérience lecteur** : Page de présentation professionnelle avant téléchargement
3. **Traçabilité** : Compteur de téléchargements par export
4. **Flexibilité** : Possibilité d'expirer des liens ou de les supprimer
5. **Cohérence** : Suit le pattern `/lecteurs/...` déjà établi

---

## Vérification (acceptance)

1. Aller sur `/admin/exportations`
2. Configurer un export ePUB avec direction artistique
3. Cliquer "Publier & Partager"
4. Vérifier que le modal affiche l'URL générée
5. Ouvrir l'URL dans un nouvel onglet (navigation privée)
6. Vérifier l'affichage de la page publique avec couverture et métadonnées
7. Cliquer "Télécharger" et vérifier que le fichier .epub se télécharge

