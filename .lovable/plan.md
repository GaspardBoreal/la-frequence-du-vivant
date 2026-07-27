## Diagnostic

Le flux actuel (`src/components/propriete/print/usePrintCombined.ts`) peut lancer `window.print()` alors que des images ne sont pas encore décodées :

- **Timeout par image de 4 s** : l'image est comptée « skipped » et l'impression continue sans elle.
- **Garde-fou global de 15 s** : `window.print()` est appelé de force, quel que soit l'état du chargement.
- **Aucune reprise** : une image en échec (URL signée lente, transformation Supabase générée à la volée pour la 1ʳᵉ fois) n'est jamais retentée.
- **`load` ≠ prêt à peindre** : sans `img.decode()`, une image peut être « chargée » mais pas encore rasterisée au moment de l'aperçu.

D'où le symptôme : 1ʳᵉ impression incomplète (cache Supabase froid, chaque variante `render/image` est calculée), 2ᵉ impression complète (tout en cache navigateur/CDN).

## Ce qu'on change

### 1. Chargement garanti, avec reprises
- Forcer `loading="eager"` + `decoding="sync"` sur toutes les images du portail avant préchargement (balayage DOM dans le hook, aucun changement dans les layouts).
- Nouvelle fonction `ensureImage(img)` : attente `load`, puis `await img.decode()`.
- **Retry x3** par image avec backoff (600 ms / 1,5 s / 3 s) et cache-buster (`&_r=n`) sur la tentative 2+.
- **Fallback vers l'original** : si la variante `render/image` échoue après 2 essais, on retombe sur l'URL d'origine (non transformée) avant de déclarer un échec.
- Timeout par tentative porté à 8 s (au lieu de 4 s pour l'unique essai).

### 2. Plus d'impression silencieusement incomplète
- Suppression du `window.print()` forcé à 15 s. Remplacé par un **budget adaptatif** : tant que des images progressent, on attend ; l'overlay reste visible.
- Si, après tous les retries, il reste des images en échec : on **n'imprime pas automatiquement**. L'overlay affiche un état « N photographies manquent à l'appel » avec :
  - bouton **« Réessayer les manquantes »** (relance uniquement les échecs),
  - bouton **« Imprimer quand même »** (choix explicite de l'utilisateur),
  - bouton **Annuler**.
- Impression automatique uniquement quand `chargées = total` (0 manquante).

### 3. Progression fidèle
- La barre reflète les tentatives (`chargées / total`, plus « n en reprise »).
- Nouvelle étape affichée quand nécessaire : « Reprise des photographies récalcitrantes (n) ».
- Les micro-copies poétiques existantes sont conservées ; on ajoute le décompte réel pour la transparence.

### 4. Préchauffage du cache (optionnel mais recommandé)
- Au moment où le dialogue de choix d'impression s'ouvre (`PrintChoiceDialog`), lancer un préchargement discret en arrière-plan des URLs de photos (via `new Image()`), pour que la 1ʳᵉ impression parte déjà avec un cache chaud.

## Fichiers touchés

- `src/components/propriete/print/usePrintCombined.ts` — cœur de la logique (ensureImage, retries, fallback original, arrêt avant print si incomplet, nouvel état `missing` + actions `retryMissing` / `printAnyway`).
- `src/components/propriete/print/PrintPreparationOverlay.tsx` — état « photos manquantes » avec les 3 actions, décompte des reprises.
- `src/components/propriete/print/printImageUrl.ts` — helper `originalUrl(url)` pour le fallback.
- `src/components/propriete/print/PrintChoiceDialog.tsx` — préchauffage optionnel du cache images.
- `src/components/propriete/TabObserve.tsx` et `TabAnalyze.tsx` — branchement des nouvelles props de l'overlay.

## Résultat attendu

Aucune impression ne part avec des photos manquantes sans que l'utilisateur l'ait explicitement décidé ; la première impression devient aussi complète que la seconde.
