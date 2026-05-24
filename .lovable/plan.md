# Plan — Auth iNaturalist OAuth2 (auto-refresh) pour Computer Vision

## Objectif

Mettre en place une authentification OAuth2 robuste auprès d'iNaturalist pour l'endpoint `/v1/computervision/score_image`, avec rafraîchissement automatique du token côté serveur. Aucune intervention manuelle, aucun token JWT 24h à renouveler à la main.

## Secrets à provisionner

4 secrets runtime (jamais exposés au frontend) :

- `INAT_CLIENT_ID` — créé sur [https://www.inaturalist.org/oauth/applications/new](https://www.inaturalist.org/oauth/applications/new) (application type "Confidential")
- `INAT_CLIENT_SECRET` — fourni par iNat à la création de l'application
- `INAT_USERNAME` — identifiant du compte iNat dédié (recommandé : créer `marches-du-vivant` plutôt que réutiliser `gaspardboreal`)
- `INAT_PASSWORD` — mot de passe du compte

Ces 4 secrets servent au flow OAuth2 `password` grant (le seul que iNat expose pour obtenir un token Computer Vision sans interaction navigateur).

## Architecture du token

Pipeline en 2 étages, encapsulé dans un helper Deno partagé `_shared/inaturalist-auth.ts` :

```text
[Edge function] → getInatAccessToken()
                        ↓
              cache mémoire (TTL ~23h)
                        ↓ (si expiré)
   POST /oauth/token (grant=password)  → access_token
                        ↓
   POST /users/api_token (Bearer access_token) → JWT 24h
                        ↓
   cache + retourne JWT
```

Deux tokens iNat distincts :

- **access_token OAuth** (long, ~ans) → sert uniquement à obtenir le JWT
- **JWT API** (~24h) → header `Authorization: Bearer <jwt>` envoyé à `/v1/computervision/score_image`

Le helper gère :

- cache mémoire intra-instance (évite de re-négocier à chaque photo d'un batch de 81)
- refresh automatique à T-1h de l'expiration
- retry une fois sur 401 (token invalidé côté iNat)
- backoff sur 429 (rate limit)

## Code à créer

1. `supabase/functions/_shared/inaturalist-auth.ts`
  - `export async function getInatJwt(): Promise<string>`
  - lit les 4 secrets via `Deno.env.get`
  - gère cache + refresh + retry
  - logs structurés (jamais le password ni le token complet — seulement préfixe)
2. Consommation dans `recognize-marcheur-photos` (créé en Phase 1) :
  ```ts
   const jwt = await getInatJwt();
   const res = await fetch('https://api.inaturalist.org/v1/computervision/score_image', {
     method: 'POST',
     headers: { Authorization: `Bearer ${jwt}` },
     body: formData,
   });
  ```
3. Edge function utilitaire `inat-auth-healthcheck` (optionnelle, admin-only) : ping le flow complet et retourne `{ ok, expires_at }` → bouton "Tester la connexion iNat" dans la fiche événement.

## Sécurité

- Les 4 secrets restent côté edge functions uniquement (jamais dans le frontend, jamais dans la DB).
- Le healthcheck est protégé par `has_role(auth.uid(), 'admin')`.
- Logs masqués : `jwt.slice(0, 8) + '...'` jamais le token complet.

## Étapes d'exécution (après approbation)

1. `add_secret` pour les 4 noms → l'utilisateur saisit les valeurs dans le formulaire sécurisé Lovable.
2. Création du helper `_shared/inaturalist-auth.ts`.
3. Création de `inat-auth-healthcheck` + bouton "Tester" dans l'onglet Reconnaissance IA de la fiche événement.
4. Branchement dans `recognize-marcheur-photos` (Phase 1 du plan principal).

## Question résiduelle

**réutiliser `gaspardboreal**`