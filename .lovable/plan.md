# Fermer l'Atelier ramène toujours à la page d'origine

## Constat

L'Atelier du jardin est monté dans l'onglet « Palette végétale ». Toute ouverture force donc l'onglet actif sur `palette` avant d'afficher le plein écran (`openAtelier` dans `ProprieteEspace.tsx`). À la fermeture, seul l'overlay se referme : l'utilisateur se retrouve sur la Palette, même s'il venait de « Capteurs et sondes ».

Aujourd'hui deux chemins d'ouverture existent : l'entrée « Atelier du jardin » du menu « Mon projet », et le bouton « Positionner sur le plan » de Capteurs et sondes (événement `propriete:open-atelier`).

## Ce qui changera

- Ouvrir l'Atelier depuis « Capteurs et sondes » puis le fermer (bouton, Échap, ou toute autre sortie) ramène sur « Capteurs et sondes », dans l'état où on l'avait laissé.
- Même règle pour toute future entrée vers l'Atelier : on revient toujours à l'onglet d'origine.
- Ouvrir l'Atelier depuis l'entrée de menu « Mon projet › Atelier du jardin » continue de laisser l'utilisateur sur la Palette végétale à la fermeture (c'est bien la page d'origine dans ce cas).

## Détail technique

`src/pages/ProprieteEspace.tsx`
- Nouvel état `atelierReturnTab: string | null`.
- `openAtelier(intent)` mémorise l'onglet courant (`tab`) dans `atelierReturnTab` **avant** de basculer sur `palette`. Si l'onglet courant est déjà `palette`, on mémorise `palette` (comportement inchangé).
- `closeAtelier()` referme l'overlay, remet `atelierIntent` à `null`, puis, si `atelierReturnTab` diffère de l'onglet actif, rappelle `handleTabChange(atelierReturnTab)` et remet `atelierReturnTab` à `null`.
- `openAtelier` doit lire la valeur à jour de `tab` : utiliser une ref (`tabRef`) synchronisée avec `tab`, pour que le listener global `propriete:open-atelier` (abonné une fois) ne capture pas un onglet périmé.

`src/components/propriete/iot/SensorsSection.tsx`
- Le bouton « Positionner sur le plan » et l'action `onLocate` de la fiche capteur enrichissent l'événement avec `detail.returnTab: 'capteurs'`, pour que l'origine soit explicite même si l'émetteur n'est pas l'onglet actif.
- Le listener de `ProprieteEspace` utilise `detail.returnTab` s'il est fourni, sinon l'onglet courant.

Aucune donnée, aucune règle métier ni URL publique touchée : uniquement l'état de navigation local.

## Validation

- Capteurs et sondes → Positionner sur le plan → fermer par le bouton : retour sur Capteurs et sondes.
- Idem avec fermeture par Échap, et depuis la fiche capteur (« Situer sur le plan »).
- Mon projet › Atelier du jardin → fermer : reste sur Palette végétale.
- Plusieurs cycles ouvrir/fermer d'affilée, desktop et mobile, thème clair et sombre.
