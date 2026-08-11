# « Positionner sur le plan » doit arriver prêt à poser

## Constat

Aujourd'hui, le bouton « Positionner sur le plan » de « Capteurs et sondes » émet bien un signal avec l'intention `capteurs`, mais l'Atelier ignore ce détail : il s'ouvre sur l'onglet « Outils » du panneau, avec la vue de fond « Capteurs et sondes » désactivée par défaut et « Observations du vivant » activée. L'utilisateur doit donc rallumer la bonne couche à la main avant de pouvoir situer une sonde.

## Ce qui changera

Un clic sur « Positionner sur le plan » ouvre l'Atelier du jardin nourricier déjà réglé pour la pose :

- panneau latéral déplié, onglet **Calques** au premier plan, section « Vues de fond » visible ;
- **Capteurs et sondes** : allumé ;
- **Observations du vivant** : éteint (le plan reste lisible) ;
- Parcelles, Zones, Prélèvements de sol, Foyers de la Clinique : allumés ;
- si un seul capteur reste à situer, le mode « pose au clic » est déjà armé pour lui ; s'il y en a plusieurs, le bandeau des capteurs à situer est mis en avant sans présélection.

Fermer l'Atelier puis le rouvrir normalement (bouton « Ouvrir l'Atelier » de la Palette) ne change rien aux réglages habituels : l'intention ne s'applique qu'à l'ouverture depuis les capteurs.

## Détail technique

`src/pages/ProprieteEspace.tsx`
- `openAtelier` accepte une intention (`{ focus?: 'capteurs' }`) lue depuis `event.detail` de `propriete:open-atelier`, stockée dans un état `atelierIntent` et transmise à `TabPalette`. Remise à `null` à la fermeture.

`src/components/propriete/tabs/TabPalette.tsx`
- Nouvelle prop optionnelle `atelierIntent` relayée telle quelle à `PaletteStudio`.

`src/components/propriete/palette/studio/PaletteStudio.tsx`
- `useEffect` sur `open && intent?.focus === 'capteurs'` (déclenché une fois par ouverture) : `setPanelOpen(true)`, `setTab('calques')`, `setSystem(s => ({ ...s, capteurs: true, vivant: false, parcelles: true, zones: true, sol: true, sante: true }))`.
- Si `iotCapteurs` sans GPS contient exactement un élément, `setPlacingCapteurId(id)`.
- L'effet attend que `iotCapteurs` soit chargé avant d'armer la pose, et ne se rejoue pas tant que l'Atelier reste ouvert.

`src/components/propriete/palette/studio/LayersPanel.tsx`
- Ancre `id` sur le bloc « Vues de fond » et léger défilement vers cette section quand l'intention capteurs est active (prop optionnelle `scrollTo`), pour que la ligne « Capteurs et sondes » soit immédiatement sous les yeux.

Aucune donnée ni règle métier touchée : uniquement l'état d'affichage du studio.
