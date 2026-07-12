## Problèmes constatés

**1. Texte riche affiché brut**
Dans `EventsListTab.tsx` ligne 262, la description est rendue en texte brut :
```tsx
<p ...>{event.description}</p>
```
Quand la description contient du HTML riche (`<span style="…">…</span>`, `<strong>`, `<em>`…), les balises s'affichent littéralement dans la carte de résumé.

**2. Liste non rafraîchie après édition d'un event**
Dans `MarcheEventDetail.tsx` (lignes 539, 547, 555), les `onSuccess` invalident `queryKey: ['marche-events']`.
Or les vraies clés utilisées par `useMarcheEventsQuery.ts` sont :
- `['marche-events-paginated', …]`
- `['marche-events-all', …]`
- `['marche-events-stats', …]`

React Query fait un match préfixe **élément par élément** : `['marche-events']` ne matche pas `['marche-events-paginated']` (chaînes différentes). Résultat : après un save + Retour, l'ancienne catégorie (et le reste) restent affichés jusqu'à un rafraîchissement manuel.

---

## Correctifs proposés (frontend uniquement, minimalistes)

### A. Nouvel utilitaire `src/lib/htmlToPlainText.ts`
Fonction pure `htmlToPlainText(html: string): string` :
- décode via `DOMParser` (`text/html`) → `body.textContent`
- fallback regex `replace(/<[^>]*>/g, '')` + décodage entités (`&nbsp;`, `&amp;`, `&lt;`, `&gt;`, `&#39;`, `&quot;`) si SSR / parser indisponible
- collapse des espaces multiples + trim

Testable, réutilisable partout où une description riche doit apparaître en résumé (listes, cartes, tooltips).

### B. `src/components/admin/marche-events/EventsListTab.tsx`
Ligne 262, remplacer :
```tsx
<p className="…">{event.description}</p>
```
par :
```tsx
<p className="…">{htmlToPlainText(event.description)}</p>
```
Le `line-clamp-2` continue de fonctionner puisque c'est du texte pur.

### C. `src/pages/MarcheEventDetail.tsx` — invalidations correctes
Créer un petit helper local (ou inline) qui invalide **toutes** les clés de la liste, puis l'appeler dans les 3 mutations (create, update, delete) :

```ts
const invalidateEventsLists = () => {
  queryClient.invalidateQueries({ queryKey: ['marche-events-paginated'] });
  queryClient.invalidateQueries({ queryKey: ['marche-events-all'] });
  queryClient.invalidateQueries({ queryKey: ['marche-events-stats'] });
  queryClient.invalidateQueries({ queryKey: ['marche-events-dashboard-stats'] });
  queryClient.invalidateQueries({ queryKey: ['marches-map-events'] });
  queryClient.invalidateQueries({ queryKey: ['events-public-visibility'] });
  queryClient.invalidateQueries({ queryKey: ['marche-event', id] });
};
```
Utilisé dans les `onSuccess` create/update/delete. Après un clic Retour, la liste (et la carte, et les stats) reflètent immédiatement la nouvelle catégorie / le nouveau titre / etc.

Aucun changement backend, aucun changement d'URL publique, aucun changement de RLS.

## Fichiers modifiés
- `src/lib/htmlToPlainText.ts` (nouveau)
- `src/components/admin/marche-events/EventsListTab.tsx`
- `src/pages/MarcheEventDetail.tsx`
