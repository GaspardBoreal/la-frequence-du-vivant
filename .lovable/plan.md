

# Corriger la redirection post-confirmation email

## Diagnostic

- Compte de Zéphyrine : confirme avec succes
- Le `emailRedirectTo` dans `useCommunityAuth.ts` (ligne 86) utilise `window.location.origin + '/marches-du-vivant/mon-espace'`
- Si l'inscription est faite depuis `gaspardboreal.com`, la redirection pointe vers `gaspardboreal.com/marches-du-vivant/mon-espace` au lieu de `la-frequence-du-vivant.com`

## Solution

### `src/hooks/useCommunityAuth.ts` — ligne 86

Remplacer `window.location.origin` par l'URL de production en dur, avec fallback sur localhost pour le dev :

```ts
const baseUrl = window.location.hostname === 'localhost'
  ? window.location.origin
  : 'https://la-frequence-du-vivant.com';

emailRedirectTo: baseUrl + '/marches-du-vivant/connexion',
```

La destination change aussi : `/marches-du-vivant/connexion` (page de connexion) au lieu de `/marches-du-vivant/mon-espace`, pour que l'utilisateur puisse se connecter avec ses identifiants apres confirmation.

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `src/hooks/useCommunityAuth.ts` | Modifier (ligne 86 — emailRedirectTo) |

