## Remplacer les 3 leaders dans "La preuve par l'exemple"

Dans `src/pages/MarchesDuVivantAgriculture.tsx`, remplacer le tableau `leaders` (lignes 129–133) et la carte associée (lignes 367–383) pour afficher 3 portraits avec un pictogramme adapté à chaque profil.

### Nouveaux contenus

- **Vincent** — Prairie humide · Potager sol vivant · Forêt · Lande sèche
  - Picto : `Sprout` (lucide-react) — symbolise la mosaïque de milieux vivants cultivés
- **Jean-François** — Corridor écologique · Gestion des ravageurs · Partenariat apiculteurs
  - Picto : `Bug` — évoque les auxiliaires, abeilles, équilibres écologiques
- **Gaspard** — Jardin en mouvement sur 4000 m²
  - Picto : `Flower2` — évoque le jardin foisonnant à la Gilles Clément

### Changements de structure

Le type `leaders` devient :
```ts
{ nom: string; highlight: string; detail: string; icon: LucideIcon }
```

Dans la carte, remplacer le `<Trophy />` fixe par `<l.icon />` avec la même couleur lime. `highlight` = courte phrase d'accroche (ex : "Mosaïque de 4 milieux"), `detail` = la liste des pratiques.

### Ajustements complémentaires

- Importer `Sprout`, `Bug`, `Flower2` depuis `lucide-react` (en plus des imports existants — conserver `Trophy` s'il est utilisé ailleurs, sinon le retirer).
- Aucune autre section n'est modifiée.