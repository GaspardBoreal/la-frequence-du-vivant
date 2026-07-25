# Cahier complet : Portrait d'abord, J'observe ensuite

Oui, c'est clair. Voici ce qui change.

## 1. Modale de choix (`PrintChoiceDialog.tsx`)

Carte "Cahier complet" (recommandée) :

- Ordre des pictos : `Images (Portrait) · BookOpen (J'observe)` au lieu de l'inverse.
- Description : *« Le « Portrait du site » en ouverture, suivi de la synthèse « J'observe » — un seul document relié. »*
- Titre inchangé, badge "Recommandé" inchangé.

## 2. Nouvel ordre du PDF combiné (`CombinedPrintLayout.tsx`)

Actuellement (voir PDF joint) :

```
P1  Couverture Portrait ("Carnet d'atelier")
P2  Sommaire visuel (12 vignettes numérotées)
P3  Page intercalaire vide/graphique
P4  Hero photo pleine page
P5+ Doubles / respirations / photos
Pn-1 Citation
Pn   Colophon + QR
```

Nouveau montage :

```
P1  = ancienne P4 (Hero photo pleine page) — devient la COUVERTURE
      + mention "Édité le {date}" en pied de page, filet or
P2+ Sommaire visuel (toutes les pages actuelles du sommaire)
Pk+ Section J'observe (rendu <ObserveSummary printOnly />)
Pn-1 Page citation (respiration poétique)
Pn   Colophon + QR
```

Concrètement dans `CombinedPrintLayout.tsx` :

- Supprimer la section intercalaire "Deuxième partie / Portrait du site" (l'actuelle P3 du bloc dédié).
- Remplacer l'ordre `<ObserveSummary/> puis <PortraitPrintLayout/>` par : `<PortraitPrintLayout/> puis <ObserveSummary printOnly/>`.
- Passer une prop `coverVariant="hero-photo"` à `PortraitPrintLayout` pour que la 1ʳᵉ page ne soit plus la couverture crème "Carnet d'atelier" mais directement la 1ʳᵉ photo hero avec :
  - Titre propriété en surimpression bas-gauche (serif crème, filet or)
  - Mention `Édité le {jj mois aaaa}` en pied
  - Suppression de la couverture crème actuelle et de la page intercalaire graphique (ex-P3).
- Réordonner l'intérieur de `PortraitPrintLayout` : `[Hero-couverture] → [Sommaire visuel] → [reste des planches photo] → [Citation] → [Colophon]`.
- La section `<ObserveSummary printOnly/>` s'insère **entre le sommaire visuel et la citation** (avant les respirations finales), pour respecter l'ordre demandé : *Portrait (couverture + sommaire) → J'observe → Citation → Colophon*.

> Correction de lecture : tu demandes « puis les pages du sommaire visuel, puis les pages J'observe, enfin citation + colophon ». je garde **toutes les planches photo intermédiaires** dans la section Sommaire visuel .

## Point à confirmer avant build

- **(B) souple** : on **conserve les planches photo** entre le sommaire et J'observe (Portrait garde sa substance visuelle, J'observe vient juste après).

## Fichiers touchés

- `src/components/propriete/print/PrintChoiceDialog.tsx` — ordre pictos + description.
- `src/components/propriete/print/CombinedPrintLayout.tsx` — inversion Portrait/J'observe, suppression page intercalaire.
- `src/components/propriete/portrait/PortraitPrintLayout.tsx` — prop `coverVariant`, réorganisation interne, option `omitPhotoPlates` pour la variante (A).

## Vérification

`/propriete/jardin-monde-deviat` → J'observe → Imprimer → Cahier complet → aperçu : P1 = hero photo avec date en pied, puis sommaire, puis J'observe, puis citation, puis colophon. Plus de page intercalaire "Deuxième partie".