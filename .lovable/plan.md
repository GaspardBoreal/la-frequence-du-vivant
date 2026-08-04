# Colonne ÉTAT : pictos encore plus petits à l'impression

Les pastilles de strates et la pastille d'état sont désormais en couleur mais occupent encore trop de largeur dans la colonne ÉTAT du registre imprimé. On réduit d'un cran supplémentaire.

## Ce qui change

- Taille d'impression du sceau des strates : icônes de 11 px → **8 px**, espacement inter-pastilles réduit à 1 px.
- Épaisseur de trait et taille des glyphes internes ajustées pour rester lisibles à cette échelle.
- Pastille « À compléter / Complet » réduite à ~3,8 pt avec picto de 2,8 pt.
- La colonne conserve ses couleurs et reste sur une seule ligne par prélèvement.

## Détails techniques

- `src/components/propriete/analyze/sample/StrataSeal.tsx` : `DIM.print` passe à `{ icon: 8, gap: 1 }`.
- `src/index.css` (bloc `@media print`) : `.register-state-pill` en 3,8 pt, SVG à 2,8 pt, padding réduit ; taille de police de la colonne 7 alignée.
