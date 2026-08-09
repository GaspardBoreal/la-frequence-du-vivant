# Fusionner le filtre d'avancement dans le sommaire

Aujourd'hui la barre « Tous / Faits / En cours / À faire » est un élément séparé, posé plus bas dans la page : elle flotte au-dessus du texte et laisse voir les cartes derrière elle.

Objectif : elle devient la **deuxième ligne du sommaire**, dans le même bandeau que « Entretien / Lecture d'ensemble / Chantiers / Planning / Extraits ». Un seul bloc collant, opaque, sans interstice — le contenu défile proprement dessous.

## Ce que l'on obtient

```text
┌──────────────────────────────────────────────┐
│ 01 Entretien  02 Lecture…  03 Chantiers  …   │  ← ligne 1 : sections
│ Tous 27 · Faits 4 · En cours 0 · À faire 23  │  ← ligne 2 : avancement
└──────────────────────────────────────────────┘
   (contenu qui défile, jamais visible au travers)
```

- Les deux lignes sont séparées par un filet discret, fond plein (aucune transparence).
- Le clic sur un filtre continue de faire défiler jusqu'à « Chantiers » et de filtrer les cartes.
- La ligne des filtres s'estompe/masque quand on n'est pas dans la section « Chantiers » ? Non : elle reste visible en permanence, pour rester accessible en un clic depuis n'importe quelle section.
- Comportement identique sur la page web publique et dans le panneau du CRM.
- Rien de tout cela n'apparaît à l'impression.

## Détails techniques

- Nouveau contexte léger `RoadmapFilterContext` (`src/components/partners/roadmap/RoadmapFilterContext.tsx`) : expose `filter`, `setFilter`, les compteurs (`total`, `done`, `doing`, `todo`) et `applyFilter` (réinitialise les cartes épinglées + scroll vers `#roadmap-03`).
- `PartnerRoadmapContent.tsx` : l'état `filter`/`pinned` et le calcul des compteurs sont remontés dans un `RoadmapFilterProvider` qui enveloppe le contenu ; la barre collante interne (`sticky top-[93px] …`) est supprimée. Le contenu se contente de consommer le contexte pour filtrer les cartes.
- `RoadmapTocNav.tsx` : rendu en deux rangées dans un même conteneur `sticky` opaque ; la seconde rangée lit le contexte et n'est rendue que si un provider est présent (la nav reste utilisable seule).
- Placement du provider : dans `PartenaireFeuilleDeRoute.tsx` et `PartnerAuditDrawer.tsx`, le `RoadmapFilterProvider` enveloppe à la fois `RoadmapTocNav` et `PartnerRoadmapContent`, pour que la nav et les cartes partagent le même état.
- Décalage d'ancrage : `scroll-mt` des sections ajusté à la nouvelle hauteur du bandeau (deux rangées) ; dans le drawer, la nav reste `sticky top-0` du conteneur défilant.
