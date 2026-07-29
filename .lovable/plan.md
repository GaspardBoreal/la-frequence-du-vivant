## Diagnostic (vérifié dans le code)

Deux causes distinctes, aucune côté base de données :

1. **Les ouvrages ne s'affichent pas sur la carte du chapitre 2.** `ZonesMapBlock.tsx` charge bien `useProprieteObjets` (ligne 158) mais ne s'en sert **que pour compter** (« · 5 ouvrages », ligne 401). La carte ne dessine que les parcelles cadastrales et les `propriete_zones` — aucune couche pour les objets de l'Atelier. D'où une carte vide alors que le bandeau annonce 5 ouvrages.

2. **Les textes des fiches sont invisibles, pas absents.** `OuvrageRecoCard.tsx` pose des fonds clairs (`bg-[hsl(var(--ds-cream))]`) sans jamais fixer la couleur du texte, contrairement au reste de `TabPalette` qui écrit systématiquement `text-[hsl(var(--ds-forest-deep))]`. L'application étant verrouillée en mode sombre, la couleur héritée est claire → texte crème sur fond crème. C'est exactement ce que montre la copie 2 : les pastilles 1→5 de « Mise en œuvre », les jalons An 0 / 1 / 3 et le cadre « Espèces & compagnonnage » sont rendus (la section n'apparaît que si la liste n'est pas vide) mais leur contenu est illisible. La base de recommandations est bien remplie (la mare a 5 étapes, un calendrier, 3 paliers d'entretien et 4 lignes d'espèces).

## Correction 1 — Les ouvrages sur la carte

Dans `ZonesMapBlock.tsx`, ajouter une couche de rendu des objets, sous les zones :

- polygones, lignes et points selon la géométrie de chaque objet, dans la couleur de l'objet (`style.color`) sinon celle de son outil ;
- glyphe de l'outil en marqueur `divIcon` pour les points (pas japonais, arbre, nichoir…) ;
- tooltip : nom de l'ouvrage · type · métré ;
- respect de la visibilité (`style.visible === false` → non dessiné) ;
- clic sur un ouvrage → ouverture de sa fiche dans le registre en dessous (défilement + dépliage) ;
- les géométries des objets entrent dans le calcul des `bounds` de cadrage, pour que la carte s'ouvre sur ce qui est réellement dessiné.

## Correction 2 — Lisibilité des fiches

Dans `OuvrageRecoCard.tsx` : appliquer `text-[hsl(var(--ds-forest-deep))]` sur le conteneur des fiches et sur les blocs à fond crème (étapes, entretien, espèces, chiffres, sources, note de chantier), même grammaire que `ZonePaletteCard`. Les cartouches de vigilance gardent leur ocre. Vérification visuelle dans le navigateur après correction, pour ne pas re-livrer un texte invisible.

## Correction 3 — Espèces & compagnonnage réellement utile

- Afficher la section **même vide**, avec un état explicite « à compléter » plutôt qu'un silence.
- Compléter le socle pour les types encore servis par le repli de famille (le générique « usage », « patrimoine », « biodiversité » n'ont qu'une ligne) : listes d'espèces rédigées par type d'ouvrage.
- Croisement avec la palette : quand l'ouvrage est rattaché à un emplacement, marquer d'une pastille les espèces déjà retenues dans la palette de cet emplacement, et signaler celles conseillées mais absentes.

## Fichiers concernés

- `src/components/propriete/palette/ZonesMapBlock.tsx` — couche ouvrages + bounds + sélection
- `src/components/propriete/palette/OuvrageRecoCard.tsx` — couleurs de texte, section espèces
- `src/lib/ouvrageRecoKb.ts` — enrichissement des listes d'espèces des fiches génériques
- `src/components/propriete/palette/OuvragesRegister.tsx` — ouverture d'une fiche depuis la carte

Aucune migration de base nécessaire.
