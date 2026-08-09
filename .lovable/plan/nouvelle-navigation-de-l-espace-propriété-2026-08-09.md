# Nouvelle navigation de l'espace propriété

## Ce qui change

La barre d'onglets passe de 6 entrées à plat à 4 entrées :

```text
J'observe   J'analyse   J'identifie   Mon projet ▾
                                       ├─ Portrait · Galerie   (arrivée par défaut)
                                       ├─ Portrait · Cadastre
                                       ├─ Je synthétise
                                       ├─ Palette végétale
                                       └─ Atelier du jardin
```

- « Mon projet » est un menu déroulant. Le bouton reste visuellement actif tant qu'une de ses entrées est ouverte, et affiche le nom de l'entrée courante (ex. « Mon projet · Cadastre »).
- Ouvrir « Mon projet » sans choisir arrive sur Portrait › Galerie.
- « Atelier du jardin » bascule sur la Palette végétale et ouvre directement l'Atelier nourricier en plein écran.
- L'onglet d'arrivée sur la page reste le Portrait (Galerie), comme aujourd'hui.

## Détail technique

`src/pages/ProprieteEspace.tsx`
- Les valeurs d'onglet Radix restent inchangées (`portrait`, `observe`, `analyze`, `identify`, `synthesize`, `palette`) : aucun `TabsContent` n'est déplacé, donc aucune régression de contenu.
- La `TabsList` n'expose plus que `observe`, `analyze`, `identify`. Le groupe « Mon projet » est un `DropdownMenu` qui appelle le même `handleTabChange` (donc le scroll persistant et l'événement `propriete:goto-tab` continuent de fonctionner).
- Nouvel état `portraitSub` (`'galerie' | 'cadastre'`) passé en prop contrôlée à `TabPortrait`.
- L'entrée Atelier : `handleTabChange('palette')` puis `window.dispatchEvent(new Event('propriete:open-atelier'))` au tick suivant.

`src/components/propriete/portrait/TabPortrait.tsx`
- Le sous-onglet interne devient contrôlable : props optionnelles `subTab` / `onSubTabChange`, avec repli sur l'état local existant (`'galerie'` par défaut). Les boutons Galerie/Cadastre internes sont masqués quand le pilotage vient de la barre, pour éviter le doublon.

`src/components/propriete/palette/ZonesMapBlock.tsx`
- Écoute `propriete:open-atelier` et passe `studioOpen` à vrai. Le bouton « Ouvrir l'Atelier » existant reste en place.

## Vérification des liens

- `propriete:goto-tab` (utilisé par TabObserve et les autres renvois internes) : conservé, valeurs identiques.
- Boutons internes renvoyant vers Palette / Synthèse / Portrait : inchangés puisque les identifiants d'onglet ne bougent pas.
- Aucune URL publique touchée (la navigation est locale, non routée).
- Contrôle final : ouverture de chaque entrée du menu, retour depuis l'Atelier, thème clair et sombre, largeur 375 px (le menu déroulant remplace le débordement horizontal de la barre).
