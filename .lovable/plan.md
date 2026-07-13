## Ajouter Marcheurs_13.jpg au bento « La joie de marcher à plusieurs »

1. **Upload asset** : `lovable-assets create --file /mnt/user-uploads/Marcheurs_13.jpg --filename Marcheurs_13.jpg > src/assets/marcheurs/Marcheurs_13.jpg.asset.json`

2. **Éditer `src/components/carte-mdv/tabs/EnsembleTab.tsx`** :
   - Importer `m13` depuis le nouveau pointeur asset
   - Ajouter une entrée dans le tableau `BENTO` (photo verticale portrait des marcheurs sur un chemin, un observant le ciel avec son téléphone) avec `aspect-[4/5]` et un alt descriptif : *« Groupe de marcheurs observant le ciel sur un chemin de campagne »*
   - Placer l'entrée de manière à préserver l'équilibre visuel de la mosaïque (insertion en milieu de séquence pour ne pas casser le rythme des `sm:col-span-2`)

Aucune autre modification.
