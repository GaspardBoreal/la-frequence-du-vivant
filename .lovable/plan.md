## Objectif

Ajouter deux fins traits verticaux dans la barre d'étapes de `/propriete/:slug` :
- entre **Portrait** et **J'observe** (fin du préambule / début de la méthode)
- entre **Je synthétise** et **Palette végétale** (fin du diagnostic / passage à l'action)

## Mise en œuvre

Fichier unique : `src/pages/ProprieteEspace.tsx` (lignes 375-382, dans le `TabsList`).

Insérer entre les `TabsTrigger` concernés un séparateur décoratif :

```tsx
<span aria-hidden className="mx-2 self-center h-4 w-px shrink-0 rounded-full bg-gradient-to-b from-transparent via-primary/35 to-transparent" />
```

Détails de design :
- trait de 1px, hauteur 16px, dégradé vertical qui s'estompe aux extrémités (pas de barre dure, plus élégant sur fond vert sombre)
- `aria-hidden` + purement décoratif : aucun impact sur la navigation clavier ni sur l'ordre des onglets Radix
- `shrink-0` pour ne pas être écrasé dans le scroll horizontal mobile
- couleur via token `primary` (pas de couleur en dur), donc cohérente avec le thème sombre

## Hors périmètre

Aucun changement de logique d'onglets, de scroll ou de contenu.