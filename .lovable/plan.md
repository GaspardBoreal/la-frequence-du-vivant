# Fix : fiche entreprise illisible depuis la carte CRM

## Diagnostic

Dans `src/pages/CrmAnnuaire.tsx` (lignes 569-593), l'onglet Carte rend un panneau flottant en overlay :

```tsx
<div className="hidden lg:block absolute top-4 right-4 bottom-4 w-[420px] z-[450] pointer-events-none">
  <div className="h-full rounded-2xl border bg-card/85 backdrop-blur-xl ...">
    <CompanyDetailContent ... mode="inline" />
```

Deux défauts cumulés :
1. **420 px de large** : `CompanyDetailContent` rend 7 onglets en `sm:grid-cols-7` → chaque onglet ≈ 55 px, les libellés (« Identité », « Opportunités », « Marches », « Leviers »…) se chevauchent (visible sur la capture).
2. **`bg-card/85 backdrop-blur-xl`** sur la carte sombre → texte gris à peine lisible.

Par ailleurs `CompanyDetailSheet` (le Sheet plein-droite déjà utilisé partout ailleurs) est explicitement désactivé pour l'onglet carte (ligne 617 : `companyId={tab === 'carte' ? null : drawerId}`). On le réactive.

## Correctif

### `src/pages/CrmAnnuaire.tsx`

1. **Supprimer** le bloc panneau flottant 420 px (lignes 579-592) et le Sheet bottom mobile dédié (lignes 595-610) — devenus redondants.
2. **Supprimer** la prop `flyOffsetX` (utilisée pour décaler la carte sous le panneau flottant) ou la passer à `0` ; la carte garde son zoom/centre naturel.
3. **Réactiver** `<CompanyDetailSheet />` pour l'onglet carte : supprimer le ternaire `tab === 'carte' ? null : drawerId` → passer simplement `companyId={drawerId}`.

### `src/components/crm/CompanyDetailSheet.tsx`

Élargir et solidifier le Sheet pour être confortable et lisible **au-dessus de la carte** :

```tsx
<SheetContent
  side="right"
  className="w-full sm:max-w-2xl lg:max-w-3xl p-0 flex flex-col bg-background"
>
```

- `lg:max-w-3xl` (768 px) laisse de la respiration aux 7 onglets.
- `bg-background` (opaque) supprime tout effet de transparence parasite.
- Le bouton X de fermeture intégré au `SheetContent` shadcn + le bouton interne `CompanyDetailContent.onClose` suffisent à fermer.

### Préservation de l'état carte

Le Sheet est un overlay : `CrmCompaniesMap` reste monté sous lui. Quand on ferme, on retrouve **strictement** :
- les filtres (état React inchangé)
- le zoom et le centre Leaflet (l'instance map n'est jamais démontée et `flyOffsetX=0` évite tout recentrage parasite)

### Z-index

Déjà OK : le `Sheet` shadcn est désormais en `z-[1100]` (fix précédent), bien au-dessus des contrôles Leaflet.

## Vérification

1. `/admin/crm/annuaire?tab=carte`
2. Cliquer sur un marqueur entreprise → drawer plein-droite, opaque, 7 onglets lisibles, tout le contenu accessible
3. Fermer (X ou clic overlay) → retour exact à la carte (zoom + filtres préservés)
4. Mobile (< sm) → Sheet plein écran (comportement natif shadcn side="right" w-full)

Aucun changement métier, DB, ou edge function.
