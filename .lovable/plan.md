

# Mettre en valeur les marches inscrites dans "Prochaines marches"

## Concept

Les cartes des marches ou le marcheur est inscrit recevront un traitement visuel distinct : bordure emeraude lumineuse, fond legerement plus lumineux, et un badge "Inscrit" plus prominent avec une animation subtile de pulse. Les cartes non inscrites restent dans le style actuel, creant un contraste naturel.

## Modification unique

### `src/pages/MarchesDuVivantMonEspace.tsx` — lignes 197-237

**Carte inscrite** :
- Bordure : `border-emerald-400/50` au lieu de `border-white/20`
- Fond : `bg-emerald-500/15` au lieu de `bg-white/10`
- Ajout d'un liseré gauche lumineux : `border-l-2 border-l-emerald-400`
- Badge "Inscrit" agrandi avec icone animee (pulse doux), fond `bg-emerald-500/20 rounded-full px-3 py-1`
- Texte du titre en `text-emerald-100` (plus lumineux)

**Carte non inscrite** : inchangee (style actuel `bg-white/10 border-white/20`)

**Tri** : placer les marches inscrites en premier dans la liste pour une visibilite immediate

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `src/pages/MarchesDuVivantMonEspace.tsx` | Modifier styles conditionnels + tri |

