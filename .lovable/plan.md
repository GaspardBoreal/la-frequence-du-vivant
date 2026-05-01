## Constat

Sur la copie d'écran, un fichier `.heic` ajouté affiche un placeholder texte "HEIC iPhone" au lieu d'une vraie miniature. Raison technique : `URL.createObjectURL(file)` ne sait pas afficher un blob HEIC sur Chrome/Firefox/Edge/Safari desktop. Seul Safari iOS lit HEIC nativement.

L'expérience est inacceptable : le marcheur ne peut pas vérifier visuellement qu'il importe les bonnes photos.

## Solution

Générer **une vraie miniature JPEG côté client en arrière-plan** dès qu'un fichier HEIC est ajouté à la liste, puis afficher la preview progressivement.

Contraintes :
- Conversion HEIC = lent (5-30 s sur vieux iPhone). Donc **non bloquant**.
- Limiter la concurrence (1 conversion à la fois) pour ne pas saturer le device.
- Afficher un état pédagogique pendant l'attente ("Conversion en cours…").
- Court-circuit sur Safari iOS : `URL.createObjectURL` direct, instantané.
- Cacher les résultats par `WeakMap<File, …>` pour éviter de reconvertir si l'utilisateur reste dans le panneau.
- Annuler proprement si le fichier est retiré de la liste avant la fin.
- Libérer les `objectURL` au démontage.

## Architecture

### 1. Nouveau mode "preview rapide" dans `heicConverter`

Ajout d'une fonction `convertHeicForPreview(file)` :
- Qualité 0.6, max-side ~400 px (suffisant pour une miniature 96×96).
- Timeout court (12 s) — au-delà on abandonne et on affiche le placeholder.
- Une seule stratégie principale : `heic-to` (ou canvas natif sur Safari iOS).
- Pas de fallback `heic2any` (trop lent en preview, on tolère un échec).
- Retourne `File` (JPEG) ou `null` si échec.

### 2. Nouveau hook `useHeicPreviews(files)`

`src/hooks/useHeicPreviews.ts` :
- Reçoit `File[]` en paramètre.
- Maintient un `Map<File, { url: string|null, status: 'pending'|'converting'|'ready'|'error' }>`.
- Stratégie par fichier :
  - Si non-HEIC → `URL.createObjectURL` immédiat → `ready`.
  - Si HEIC + Safari iOS → `URL.createObjectURL` immédiat → `ready` (Safari lit nativement).
  - Sinon → ajout dans une queue séquentielle de conversion preview.
- `useEffect` cleanup : `URL.revokeObjectURL` pour chaque entrée à la suppression d'un fichier ou au démontage.
- Renvoie une fonction `getPreview(file)` retournant `{ url, status }`.

### 3. UI dans `ConvivialiteUploadFAB`

Pour chaque vignette :
- État `pending`/`converting` → skeleton animé (pulse) + petit `Loader2` + label discret "HEIC".
- État `ready` → miniature normale + petit badge "HEIC" en bas si c'était un fichier iPhone (info pédagogique).
- État `error` → fallback au placeholder texte actuel.

Visuel cible (cellule 96×96) :
```text
┌──────────────┐
│   ⟳ skeleton │   pendant conversion
│   pulsant    │
└──────────────┘
       ↓
┌──────────────┐
│              │
│    PHOTO     │   après conversion
│   [HEIC]     │   badge discret en bas
└──────────────┘
```

## Fichiers impactés

```text
src/utils/heicConverter.ts                                              (+ convertHeicForPreview)
src/hooks/useHeicPreviews.ts                                            (nouveau)
src/components/community/exploration/convivialite/ConvivialiteUploadFAB.tsx  (utilise le hook)
```

Aucun changement DB, pas d'edge function, pas de nouvelle dépendance — la lib `heic-to` est déjà installée et utilisée.

## Détails techniques

### Queue séquentielle (anti-saturation)

```ts
const queue: Array<() => Promise<void>> = [];
let running = false;
async function drain() {
  if (running) return;
  running = true;
  while (queue.length) {
    const job = queue.shift()!;
    try { await job(); } catch {}
  }
  running = false;
}
```

### Annulation propre

Si un fichier est retiré de `files` avant que sa preview soit prête, on marque
sa job comme `cancelled` via un drapeau dans le state du hook ; la job vérifie
ce drapeau avant d'écrire dans le `Map` et libère immédiatement l'objectURL si
généré.

### Détection Safari iOS

Réutilise `isSafariIOS()` déjà présent dans `heicConverter.ts`.

### Cache

`WeakMap<File, PreviewEntry>` pour que le GC libère automatiquement quand les
File références disparaissent.

## Comportement utilisateur final

1. Marcheur sélectionne 5 photos iPhone.
2. Les non-HEIC apparaissent immédiatement.
3. Les HEIC apparaissent en skeleton pulsant avec petit loader.
4. Sur desktop/Android : chaque preview s'affiche après 1-3 s en moyenne.
5. Sur Safari iOS : tout est instantané (lecture native).
6. Si une conversion échoue : la vignette montre proprement le placeholder
   "HEIC iPhone" actuel — l'upload final retentera avec la cascade complète.
