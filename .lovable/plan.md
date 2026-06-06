## Problème

La route d'un résultat « pratique » porte `tab=apprendre` mais pas le sous-onglet ni le sens. La bascule vers **La main** repose uniquement sur le focus-bus consommé au mount de `CeQueNousAvonsVu`. Cette fenêtre de 4 s n'est pas garantie quand on arrive de l'extérieur (home, recherche cross-marche, deep-link partagé), d'où la retombée sur **L'œil**.

## Objectif

Un deep-link de pratique atterrit **toujours** sur `Apprendre → Ce que nous avons vu → La main`, avec la fiche pratique déjà déroulée et halo emerald.

Étendu aux autres kinds pour cohérence :

| kind       | tab        | sub (Apprendre)   | sensory |
| ---------- | ---------- | ----------------- | ------- |
| practice   | apprendre  | decouvertes       | main    |
| testimony  | apprendre  | decouvertes       | coeur   |
| species    | apprendre  | decouvertes       | oeil    |
| text       | apprendre  | decouvertes       | coeur   |

(la route « espèce » conserve aussi sa variante `biodiversite` quand on vient de la carte ; ce plan ne touche que la branche « pratique » / Apprendre.)

## Changements

### 1. URL — enrichir la RPC `search_global`
Ajouter `&sub=decouvertes&sensory=main` à la route pratique :
```text
/marches-du-vivant/mon-espace/exploration/<exp>
  ?focus=practice:<id>&tab=apprendre&sub=decouvertes&sensory=main
```
Migration : nouvelle révision de `search_global` (même corps que la dernière, seules les lignes route des branches `practice` / `testimony` / `text` portant sur Apprendre sont enrichies).

### 2. `useFocusFromUrl` — pas de changement
Déjà capable de relire `sub` et `sensory`.

### 3. `ExplorationMarcheurPage`
Étendre le `useEffect` qui consomme `focus` :
- déjà : map `kind→tab`, set `activeGlobalTab`
- **ajout** : si `focus.tab === 'apprendre'`, propager `focus.sub` (decouvertes/apprendre-creer) et `focus.sensory` (oeil/main/coeur/oreille/palais) à `ApprendreTab` via deux nouvelles props `initialApprendreSub` / `initialApprendreSensory` (état local de la page, consommé une fois).
- conserver `dispatchFocus(...)` pour le halo + auto-expand de `MainCuration`.

### 4. `ApprendreTab`
- Accepter `initialApprendreSub?: 'decouvertes' | 'apprendre-creer'` et `initialApprendreSensory?: SenseKey`.
- `useState(initialApprendreSub ?? 'decouvertes')` pour le sous-onglet.
- Passer `initialSensory={initialApprendreSensory}` à `CeQueNousAvonsVu`.

### 5. `CeQueNousAvonsVu`
- Accepter `initialSensory?: SenseKey`.
- `useState<SenseKey>(initialSensory ?? 'oeil')`.
- Conserver l'abonnement focus-bus en filet de sécurité (déjà en place), mais l'init via props devient la source primaire — plus de dépendance au timing.

### 6. `MainCuration`
Déjà compatible : reçoit le focus via le bus et `data-focus-id="practice:<id>"`. Le halo (`FocusHalo`) cible déjà la carte. Rien à changer.

## Validation manuelle

1. Depuis la home `/marches-du-vivant/mon-espace`, taper `tonte` → cliquer la pratique.  
   ✅ Atterrissage direct sur Apprendre › Ce que nous avons vu › La main, carte « Tondre moins… » dépliée + halo.
2. Recharger l'URL deep-link (test à froid, sans recherche en amont) → même résultat (prouve qu'on ne dépend plus du bus).
3. Cliquer un témoignage → atterrit sur `coeur`.
4. Cliquer une espèce depuis la recherche → continue d'atterrir sur l'œil (régression non introduite).

## Pas dans le scope

- Refactor du focus-bus.
- Changements de la barre de recherche / `SearchResultCard`.
- Modifications visuelles.
