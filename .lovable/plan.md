## Corrections vue Cadastre

### 1. Afficher le vrai pourtour de parcelle (comme page Bioacoustique)

Aujourd'hui `CadastreLayer` lit `data._raw.cadastre.shape` qui n'est pas fourni par LEXICON. Il faut ajouter le second appel vers l'Edge Function `cadastre-proxy` (déjà utilisée par `CadastralMap.tsx`) qui retourne la géométrie réelle à partir de l'ID cadastral.

**Modifs `src/components/cadastre/useLexiconParcels.ts`**
- Ajouter `useParcelGeometryById(parcelId)` qui appelle `supabase.functions.invoke('cadastre-proxy', { body: { parcelId } })` et renvoie `data.data` (Polygon GeoJSON).
- Ajouter `useLexiconParcelsWithGeometry(points)` : pour chaque point, chaîne `lexicon-proxy` → `cadastre-proxy` (via `useQueries` en deux étapes ou un hook composé). Cache 30 min, pas de retry agressif.

**Modifs `src/components/cadastre/CadastreLayer.tsx`**
- Remplacer `useLexiconParcels` par le hook composé.
- Lire la géométrie dans cet ordre : géométrie cadastre-proxy → fallback `data._raw.cadastre.shape` → `data.geometry`.
- Conserver le style rouge/jaune (cohérent avec la page Bioacoustique).

### 2. Boutons zoom visibles en mode Cadastre

Dans `ExplorationCarteTab.tsx > ZoomControls`, accepter une prop `mapStyle` et adapter classes :
- `cadastre` : fond `bg-emerald-900/85 border-emerald-700/40 text-white` (contraste fort sur OSM clair)
- autres styles : style actuel inchangé

### 3. Marqueurs uniformes en mode Cadastre

Dans `createNumberedIcon`, ajouter paramètre `uniformSize?: boolean`. Quand vrai, forcer `size = 32` (largeur unique) et désactiver le scaling par `contribCount`. Passer `uniformSize={mapStyle === 'cadastre'}` depuis le rendu des marqueurs.

### Fichiers touchés
- `src/components/cadastre/useLexiconParcels.ts` — ajouter hook composé géométrie
- `src/components/cadastre/CadastreLayer.tsx` — utiliser géométrie cadastre-proxy
- `src/components/community/exploration/ExplorationCarteTab.tsx` — props `mapStyle` sur ZoomControls + `uniformSize` markers
- (optionnel) `src/components/cadastre/CadastreMapStandalone.tsx` — bénéficie automatiquement du fix géométrie

### Hors périmètre
- Pas de changement de couleur/style autre que celui des boutons zoom en mode Cadastre.
- Pas de modification du repositionnement GPS.
- Pas de fetch des parcelles voisines automatiques.
