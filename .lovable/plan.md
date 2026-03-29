

# Fix: Upload bloque sur Android — `heic2any` bloque le thread

## Diagnostic

Le module `heic2any` est importe **statiquement** (top-level `import`) dans `useMarcheurContributions.ts` et `photoUtils.ts`. Cette librairie fait ~2MB et utilise du WebAssembly. Sur certains navigateurs Android (Chrome mobile), le chargement du module peut **bloquer ou echouer silencieusement**, empechant la resolution de la Promise de mutation. Le `isPending` reste `true` indefiniment → "Upload en cours" tourne en boucle.

Meme si le fichier selectionne est un JPEG normal (pas HEIC), le simple fait d'importer `heic2any` au top-level peut causer des problemes sur mobile.

## Correctif

### 1. Import dynamique de `heic2any` — uniquement quand necessaire

Dans `src/hooks/useMarcheurContributions.ts` et `src/utils/photoUtils.ts` :

- **Supprimer** `import heic2any from 'heic2any'` du top-level
- **Importer dynamiquement** uniquement quand un fichier HEIC est detecte :

```typescript
if (isHeic) {
  const heic2any = (await import('heic2any')).default;
  // conversion...
}
```

### 2. Ajouter un timeout de securite

Wrapper l'appel `heic2any()` dans un `Promise.race` avec un timeout de 30 secondes. Si la conversion depasse ce delai, lancer une erreur explicite au lieu de bloquer indefiniment.

```typescript
const convertWithTimeout = Promise.race([
  heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 }),
  new Promise((_, reject) => setTimeout(() => reject(new Error('Conversion HEIC timeout')), 30000))
]);
```

### 3. Ajouter un try-catch avec toast d'erreur

Si la conversion echoue (timeout ou erreur), afficher un message explicite a l'utilisateur au lieu de rester bloque :

```
"Format non supporte. Veuillez convertir l'image en JPEG avant de l'uploader."
```

## Fichiers impactes

| Fichier | Action |
|---|---|
| `src/hooks/useMarcheurContributions.ts` | Import dynamique + timeout sur heic2any |
| `src/utils/photoUtils.ts` | Import dynamique + timeout sur heic2any |

