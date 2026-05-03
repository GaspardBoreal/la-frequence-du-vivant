## Diagnostic

**Bug bloquant — la feuille de réattribution n'apparaît pas**

La `MediaAttributionSheet` repose sur le composant `Sheet` de shadcn/Radix, dont l'overlay et le contenu sont fixés à `z-50` (`src/components/ui/sheet.tsx`).

Or les lightbox depuis lesquels on déclenche l'attribution sont à des z-index bien plus élevés :
- `contributions/MediaLightbox` (vue Fiche, MarcheDetailModal) : `z-[60]`
- `ConvivialiteMosaic` lightbox : `z-[100]`
- `insights/curation/MediaLightbox` : `z-[1000]`
- `ConvivialiteImmersiveView` : `z-[1100]`

Résultat : quand on clique sur le crayon, la sheet s'ouvre **derrière** l'overlay noir du lightbox parent → invisible et non interactive. Aucune erreur console car le Radix Dialog est bien monté.

**Lisibilité chip auteur (Copie 2)**

Dans `ConvivialiteMosaic.tsx` (lightbox), le chip auteur en bas de l'image est `bg-white/10` avec un `ring-1 ring-white/15`. Sur fond clair (forêt, ciel), le contraste est faible et la pastille disparaît visuellement, contrairement à la Copie 1 (vue immersive de la mosaïque) où la pill émeraude pleine ressort bien.

## Corrections

### 1. `src/components/community/insights/curation/MediaAttributionSheet.tsx` — fix z-index

Remplacer le `<SheetContent>` par un portail explicite avec overlay et content forcés au-dessus de tous les lightbox :

```tsx
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetPortal>
    <SheetOverlay className="z-[1200]" />
    <SheetPrimitive.Content
      className="fixed bottom-0 inset-x-0 z-[1210] ... rounded-t-2xl ..."
    >
      ...
    </SheetPrimitive.Content>
  </SheetPortal>
</Sheet>
```

Approche choisie : importer `SheetPortal`, `SheetOverlay` depuis `@/components/ui/sheet` et `SheetPrimitive` depuis `@radix-ui/react-dialog` afin de surcharger `z-index` sans toucher au composant UI partagé (qui est utilisé partout). On conserve toute la mise en forme actuelle (handle drag, header, search, liste, footer sticky).

### 2. `src/components/community/exploration/convivialite/ConvivialiteMosaic.tsx` — renforcer chip auteur

Lignes 252–278 : transformer le bouton en pastille émeraude affirmée + agrandir typo + ombre douce, conformément à la Copie 1.

```tsx
className={`group inline-flex items-center gap-2 px-4 py-2 rounded-full
  shadow-lg shadow-black/40 backdrop-blur transition
  ${canReattribute
    ? 'bg-emerald-600/90 hover:bg-emerald-500 ring-1 ring-emerald-300/40 cursor-pointer'
    : 'bg-emerald-600/85 ring-1 ring-emerald-300/30 cursor-default'}`}
```
- Icône `User` en blanc opaque
- `<span>` en `text-white font-semibold text-sm`
- Crayon en `text-white/85`

### 3. Vérification de cohérence

- `contributions/MediaLightbox.tsx` (z-[60]) : déjà branché sur la même `MediaAttributionSheet`, bénéficiera automatiquement du fix.
- `insights/curation/MediaLightbox.tsx` (z-[1000]) : idem.
- Aucun changement de schéma DB ni de RPC.

## Fichiers modifiés

- `src/components/community/insights/curation/MediaAttributionSheet.tsx` — overlay + content z-[1200/1210], portail explicite
- `src/components/community/exploration/convivialite/ConvivialiteMosaic.tsx` — pastille auteur émeraude renforcée (mobile-first, contraste AA)

## QA après implémentation

1. Vue Convivialité (mosaïque) → ouvrir une photo → cliquer le crayon → la bottom-sheet doit apparaître **par-dessus** l'overlay noir.
2. Vue Fiche (`MarcheDetailModal` › Voir) → ouvrir une photo → crayon → sheet visible.
3. Vue Curation (`MainCuration`) → idem.
4. Sur mobile (375px) et desktop (≥640px) : sheet ancrée en bas avec safe-area, scroll interne fonctionnel, bouton Confirmer atteignable.
5. Pastille auteur dans la lightbox Convivialité : nom lisible sur photos très claires (ciel, neige) et très sombres (forêt).
