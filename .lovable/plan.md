## Oui, le problème est clair

Dans le PDF V4, la page 8 contient encore le début de la section 06 en bas de page, et les sections 07/08 ne suivent pas sur une nouvelle page : elles sont probablement poussées hors du conteneur d’impression puis masquées.

## Cause confirmée

Le saut `print-break-before` a été ajouté à l’intérieur de `ObserveSummary`, mais dans le PDF combiné cette synthèse est enfermée dans :

```text
<section class="portrait-print-page combined-print-observe ...">
```

Or `.portrait-print-page` impose une page A4 fixe avec `height: 297mm` et `overflow: hidden`. Donc le navigateur ne peut pas fragmenter proprement le contenu interne sur deux pages. Le saut demandé à l’intérieur est trop tard / trop profond : il ne crée pas une vraie nouvelle page A4 dans le flux du cahier.

## Correctif proposé

1. Remplacer le rendu actuel de `J’observe` dans le PDF combiné par deux vraies pages A4 séparées :
   - Page J’observe A : cartouche + signature écologique + sections 01 à 05.
   - Page J’observe B : sections 06 + 07 + 08, avec un en-tête discret rappelant le nom de la propriété.

2. Ne plus compter sur un `break-before` interne pour ce cas combiné : la séparation doit être structurelle dans `CombinedPrintLayout`, avec deux `<section class="portrait-print-page ...">` distinctes.

3. Adapter `ObserveSummary` pour permettre ce rendu imprimé en deux fragments, sans impact écran :
   - mode normal inchangé pour l’application ;
   - mode impression page 1 : 01–05 ;
   - mode impression page 2 : 06–08.

4. Ajouter/ajuster les classes print dédiées :
   - pas de `overflow` destructeur sur les sous-blocs ;
   - densité légèrement optimisée en impression ;
   - `break-inside: avoid` conservé sur chaque bloc.

## Résultat attendu

```text
Page 8  : J’observe — sections 01 à 05 uniquement
Page 9  : J’observe — sections 06, 07 et 08 ensemble
Page 10 : Citation respiration
Page 11 : Colophon
```

Le rendu écran de l’onglet `J’observe` ne change pas.