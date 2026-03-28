

# Supprimer les 10 photos de test sur "Le Reveil de la Terre"

## Donnees identifiees

**Evenement** : `df85910e-82da-4ef7-98d2-d4c827d1d0ec` — "Le Reveil de la Terre : Marcher sur un sol qui respire"

**10 photos dans `marcheur_medias`** — toutes uploadees le 28 mars 2026 entre 07:29 et 07:30, toutes avec `marche_id = NULL` (ce qui confirme le bug corrige), toutes du meme utilisateur `b821bb9c-...` :

| # | ID | Titre | Public |
|---|-----|-------|--------|
| 1 | `69739d59-...` | 719E6803-... | oui |
| 2 | `03ce4e6e-...` | 1F5B5380-... | oui |
| 3 | `8ae2bcc6-...` | C4FA289B-... | oui |
| 4 | `70ad1e1a-...` | A1CB93C8-... | oui |
| 5 | `8b449c6e-...` | IMG_0929 | oui |
| 6 | `5903d3c3-...` | 8D3AD5CA-... | oui |
| 7 | `34183338-...` | 85166705-... | oui |
| 8 | `1ead73ea-...` | 102D62DD-... | oui |
| 9 | `836d2926-...` | 4CAE4BF0-... | oui |
| 10 | `f5c69bff-...` | 1A5A3DA7-... | non |

**Aucun autre enregistrement** n'existe dans `marcheur_audio` ou `marcheur_textes` pour cet evenement (non verifie mais hors scope).

## Actions a effectuer

### 1. Supprimer les 10 fichiers du bucket Storage `marcheur-uploads`

Les 10 fichiers sont dans le chemin `b821bb9c-.../photos/...`. Supprimer ces objets du bucket pour liberer l'espace.

### 2. Supprimer les 10 lignes de `marcheur_medias`

Une seule requete DELETE ciblant les 10 IDs exacts.

```sql
DELETE FROM marcheur_medias
WHERE id IN (
  '69739d59-17fd-4120-96c5-a888fffe0330',
  '03ce4e6e-402f-4037-8e81-3eea353a744f',
  '8ae2bcc6-02c1-419c-a665-331e64a0053e',
  '70ad1e1a-7935-4704-a60d-df03e4f73848',
  '8b449c6e-c303-4012-babe-1a5d11c5e278',
  '5903d3c3-a30a-44be-a0a2-1be20c2bb110',
  '34183338-c92a-41b2-b4c3-2d48d61318dc',
  '1ead73ea-f382-457f-91ee-7ee59c08043e',
  '836d2926-95ca-41a3-8d47-eb9a0aa59cb2',
  'f5c69bff-4580-4c42-a2f4-2d24234c09d5'
);
```

## Securite

- Requete ciblee sur 10 IDs explicites — aucun risque de suppression accidentelle
- Les fichiers Storage seront supprimes via l'API Supabase Storage dans un script

