# Plan : Épurer la carte partenaire BRAD

## Objectif
Supprimer le label « Partenaire IoT » transparent/redondant à l'intérieur de la carte BRAD dans le sélecteur d'espaces, sans toucher aux flux d'inscription classique ni aux autres sections du dialogue.

## Élément cible
- `src/components/community/AppChoiceDialog.tsx`, lignes 377–379 : le bloc `<div className="text-[11px] uppercase tracking-[0.12em] text-sky-200/90">Partenaire IoT</div>` à l'intérieur de la carte partenaire IoT.

## Changements prévus
1. Supprimer le label texte « Partenaire IoT » de la carte partenaire.
2. Ajuster le `mt-0.5` du nom du partenaire pour garder un espacement agréable avec le compteur de sondes en dessous.
3. Conserver la ligne de métadonnées sondes actives / maintenance (3 actives, 1 en maintenance) qui elle est utile.
4. Ne pas modifier le filtre de recherche `match(f.nom, 'partenaire iot')` qui sert uniquement à la recherche textuelle.

## Vérification
- Compilation TypeScript sans erreur.
- Rendu visuel dans le sélecteur d'espaces : la carte BRAD n'affiche plus le label, le nom et les sondes restent lisibles.
