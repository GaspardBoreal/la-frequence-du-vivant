# Badge d’état de service dans la liste de la Carte des sondes

## Diagnostic

Dans la fiche détaillée d’une sonde (copies 1 et 2), le badge « En service » / « En maintenance » est visible grâce aux helpers `capteurEtat()` et `etatMeta()` de `src/lib/iot/grandeurs.ts`.

Dans l’onglet **Carte des sondes** (`/partenaire-iot/brad-technology?tab=carte`), la liste de gauche (renderée par `src/components/iot/SensorsMapTab.tsx`) affiche actuellement :
- le nom de la sonde,
- la propriété et le modèle,
- un point de couleur de santé,
- la frise de vitalité 48 h.

Elle ne montre **pas** l’état de service déclaré. Résultat : une sonde en maintenance apparaît comme une sonde normale dans la liste, ce qui crée une incohérence avec sa fiche et complique la lecture rapide du parc.

## Ce qu’on va faire

Ajouter discrètement le badge d’état de service dans chaque ligne de la liste de la Carte des sondes, en gardant une approche mobile-first.

### Changements prévus

1. **Importer les helpers dans `SensorsMapTab.tsx`**
   - Ajouter `capteurEtat` et `etatMeta` depuis `@/lib/iot/grandeurs`.

2. **Afficher le badge dans chaque ligne de liste**
   - Calculer `const etat = capteurEtat(c); const meta = etatMeta(etat);` dans le mapping de `filtered`.
   - Insérer un petit pill à côté du nom de la sonde, avec :
     - le label issu de `meta.label` (ex. « En maintenance »),
     - une couleur de fond très légère et un texte discret,
     - une taille de texte de 10 px et une hauteur de ligne compacte.
   - Le badge est `shrink-0` pour ne pas être écrasé en mobile et s’affiche avant ou à côté du nom selon l’espace disponible.

3. **Préserver l’existant**
   - Conserver le point de santé (`sensorHealth`), la frise `VitalityStrip`, l’image de couverture et l’icône de sonde non positionnée.
   - Ne pas alourdir visuellement : le badge reste plus discret que dans la fiche détaillée.

### Fichier concerné
- `src/components/iot/SensorsMapTab.tsx`

### Critères d’acceptation
1. Ouvrir la Carte des sondes : chaque sonde en maintenance affiche un badge « En maintenance » dans sa ligne de liste.
2. Les sondes « En service » affichent le même badge, en version plus discrète.
3. Les sondes « Retirées » suivent la même logique.
4. Le rendu reste lisible sur mobile (largeur étroite de la liste).
5. Pas de modification de données, de schéma ni d’Edge Function : c’est un ajout d’affichage.
