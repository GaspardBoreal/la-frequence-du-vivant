

# Popup "Rejoindre l'aventure" : remplacer les dates statiques par les evenements dynamiques

## Probleme

La popup d'inscription affiche 3 dates codees en dur (`popupDates` ligne 68-71 : "Printemps des Poetes", "Fete de la Nature", "Solstice d'ete") qui ne correspondent pas aux vrais evenements de la table `marche_events`. Le fetch `upcomingEvents` existe deja (ligne 146-158) mais n'est utilise que dans la section cartes immersives, pas dans la popup.

## Solution

Remplacer `popupDates` par `upcomingEvents` dans la popup, en reutilisant les helpers `getSeasonIcon` et `getCountdown` deja presents.

### `src/pages/MarchesDuVivantExplorer.tsx`

1. **Supprimer** le tableau statique `popupDates` (lignes 68-71)

2. **Remplacer la boucle de la popup** (lignes 857-914) : au lieu de `popupDates.map((d) => ...)`, iterer sur `upcomingEvents` avec un design repense :

```tsx
{upcomingEvents.map((event, index) => {
  const dateFormatted = new Intl.DateTimeFormat('fr-FR', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  }).format(new Date(event.date_marche));
  const countdown = getCountdown(event.date_marche);
  const icon = getSeasonIcon(event.date_marche);
  
  return (
    <button key={event.id} onClick={() => setSelectedDate(event.id)} ...>
      {/* icon + date + countdown badge + titre + lieu + description */}
    </button>
  );
})}
```

3. **Design des cartes** : conserver l'esthetique glassmorphism actuelle (fond blanc/70, bordure subtile, indicateur radio) mais enrichir avec :
   - Badge countdown dynamique ("Dans 6 jours") en haut a droite au lieu du badge statique "Comite reduit"
   - Lieu affiche en `text-emerald-600` sous le titre
   - Icone saisonniere contextuelle (deja implementee via `getSeasonIcon`)
   - Etat vide elegant si aucun evenement

4. **Adapter le state `selectedDate`** : passer de `string | null` a stocker l'`id` (uuid) de l'evenement selectionne au lieu des anciens ids "mars"/"mai"/"juin"

5. **Adapter `handleInscription`** : utiliser `selectedDate` pour retrouver le titre de l'evenement selectionne dans `upcomingEvents` au lieu de chercher dans `popupDates`

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `src/pages/MarchesDuVivantExplorer.tsx` | Modifier (supprimer popupDates, utiliser upcomingEvents dans la popup) |

