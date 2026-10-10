# Duplication d'emplacement : guide lisible et validation fiable

## Diagnostic confirmé

**Problème 2 — Valider / Entrée sans effet.** Le journal de l'aperçu montre l'erreur `onCommitZoneDuplicate is not a function`, levée au moment du clic sur Valider. L'enregistrement s'arrête au milieu : la forme est envoyée, mais l'étape suivante plante avant la fermeture du mode Composition. La barre reste donc affichée, et chaque nouvel essai (bouton ou Entrée) relance la même erreur. En quittant ensuite l'Atelier, la copie est traitée comme abandonnée et supprimée : il n'existe aujourd'hui aucune copie dans le jardin (seuls « Massif Arbre de Judée » et « Massif méditerranéen Laurent » sont présents).
Cause : une mise à jour à chaud de l'aperçu a mélangé ancienne et nouvelle version de l'écran. Plus profondément, la validation n'est pas protégée : une seule étape en échec bloque tout, sans message, et l'écran n'attend pas la confirmation de l'enregistrement.

**Problème 1 — message posé sur la forme.** L'aide « glissez la forme… » s'affiche au centre de la carte pendant 3 secondes. La copie est créée juste à côté de l'original, donc au centre elle aussi : le message la recouvre au moment précis où il faut la manipuler.

## Ce qui change

### 1. Validation robuste
- Valider attend la confirmation réelle : bouton « Enregistrement… » désactivé pendant l'envoi, ce qui empêche aussi les doubles validations par Entrée.
- Ordre fixe : forme de la copie → ouvrages copiés → sélection végétale. Le mode Composition se ferme uniquement après succès complet, avec le message « Nouvelle composition enregistrée ».
- En cas d'échec : la barre reste ouverte, rien n'est perdu, un message clair indique l'étape en cause et propose « Réessayer ».
- Une erreur dans une étape secondaire (sélection végétale) ne bloque plus l'enregistrement de la forme ; elle est signalée séparément.
- Abandonner ou Échap ferme toujours le mode, même en cas d'erreur, et retire la copie provisoire.

### 2. Guide qui ne gêne jamais
- En Composition, plus de message au centre de la carte. Le rappel des gestes devient une fine ligne au-dessus de la barre du bas : « Glisser = déplacer · poignées = échelle · pastille dorée = rotation · 90° et miroirs dans ⋯ ».
- La copie est placée à côté de l'original, sans chevauchement (décalage d'une largeur de forme plus un petit espace).
- L'original reste visible en contour pointillé discret, comme repère de composition.
- La carte se recadre automatiquement pour montrer l'original et la copie ensemble, sans les cacher sous la barre du bas ni sous les panneaux.
- Les boutons 90°, Miroir horizontal et Miroir vertical sont visibles directement dans la barre en Composition (plus besoin d'ouvrir « ⋯ ») ; sur téléphone, ils passent en icônes larges faciles à toucher.

### 3. Gestes au doigt
- Déplacer, redimensionner et pivoter la copie fonctionnent aussi au toucher sur téléphone et tablette, pas seulement à la souris.

## Vérifications
- Dupliquer « Massif méditerranéen Laurent » (seul, puis avec ouvrages) : le guide ne recouvre pas la copie ; original et copie sont visibles ensemble.
- Valider par le bouton puis par Entrée : la copie est enregistrée, la barre se ferme, la copie reste après rechargement de la page.
- Simuler un échec d'enregistrement : la barre reste ouverte avec « Réessayer ».
- Abandonner : la copie et ses ouvrages disparaissent, l'original est intact.
- Contrôle du journal d'erreurs de l'aperçu après les essais.

## Détails techniques
- `useZoneTransform` : `save` devient asynchrone (`saving` exposé), `onPatchZone` et `onFinish` attendus via `Promise`, réinitialisation dans un `finally` pour `cancel`, fermeture seulement si le patch réussit, verrou anti double-soumission.
- `PaletteStudio` : callback `onFinish` asynchrone qui attend la mise à jour des ouvrages copiés (`Promise.all`), appelle `onCommitZoneDuplicate` de façon gardée (`typeof === 'function'`, try/catch séparé) ; état de composition aussi tenu en state React (pas seulement en ref) pour un rendu fiable ; `fitBounds` sur l'union original + copie avec marges tenant compte de la barre et des panneaux ; contour fantôme de l'original.
- `TabPalette.duplicateZone` : décalage = largeur de la boîte englobante + 15 %, au lieu de 18 % de la diagonale.
- `ZoneTransformBar` : en mode `composition`, filigrane central supprimé au profit d'une ligne d'aide ancrée au-dessus de la barre ; boutons 90°/miroirs hissés dans la barre principale ; état `saving` sur Valider.
- `ZoneTransformLayer` : passage des écouteurs souris aux Pointer Events (`pointerdown/move/up`, `setPointerCapture`) pour le tactile.
- AGENTS.md : règle ajoutée — la validation d'une composition n'est fermée qu'après confirmation de l'enregistrement.
