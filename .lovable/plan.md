## Constat

Dans `src/pages/ProprieteEspace.tsx` :
- le bouton « ↓ Descendez dans votre jardin » appelle `scrollToDiagnostic()` qui fait un `scrollIntoView({block:'start'})` sur `#diagnostic` → position correcte (copie 2) ;
- les onglets (`<Tabs value={tab} onValueChange={setTab}>`, lignes 296-304) ne déclenchent **aucun** repositionnement. Quand on clique sur « Je synthétise » alors qu'on est plus bas dans la page, le contenu change mais le scroll reste où il était, d'où l'écran mal cadré (copie 3).

## Correction

1. **Handler de changement d'onglet centralisé** : remplacer `onValueChange={setTab}` par une fonction `handleTabChange(v)` qui met à jour l'état puis, sur la frame suivante (`requestAnimationFrame`), repositionne la vue sur l'ancre `#diagnostic` exactement comme le bouton du hero.
2. **Fonction de scroll partagée** : extraire un helper `scrollToDiagnostic()` au niveau module (utilisé par le hero ET par les onglets), qui calcule la position via `getBoundingClientRect().top + window.scrollY - OFFSET` et fait `window.scrollTo({ top, behavior:'smooth' })`, où `OFFSET` correspond à la hauteur de la top-bar fixe (≈ 64 px) pour que la barre d'onglets reste visible sous le header, comme sur la copie 2.
3. **Même comportement pour la navigation programmatique** : l'écouteur de l'événement `propriete:goto-tab` (lignes 282-289) passera aussi par `handleTabChange`, pour que les liens internes (ex. « Portrait du site ») cadrent pareil.
4. **Barre d'onglets collante** : rendre la `TabsList` `sticky top-[64px] z-30` avec fond opaque, pour que les menus restent accessibles quand on descend dans un onglet long (J'analyse, J'identifie).

## Détails techniques

- Fichier unique modifié : `src/pages/ProprieteEspace.tsx`.
- Aucun changement de données ou de logique métier, uniquement navigation/présentation.
- Respect de `prefers-reduced-motion` : `behavior: 'auto'` si l'utilisateur a réduit les animations.
