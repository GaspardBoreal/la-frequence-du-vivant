# Frise de vitalité cliquable — widget « heure ouverte »

Dans `/admin/iot` (Poste de contrôle), chaque barre verticale de la frise 48 h devient cliquable : elle ouvre un widget qui déplie les relevés réellement reçus pendant cette heure-là.

## Ce que voit l'utilisateur

- Survol : la barre s'éclaircit et un curseur fin la surligne (aujourd'hui il n'y a qu'un `title` natif).
- Clic : un petit panneau s'ouvre juste sous la frise de la sonde concernée, sans quitter la page.
- Le panneau affiche :
  - l'en-tête : nom de la sonde, date et créneau horaire en heure de Paris (ex. « samedi 16 août, 15 h → 16 h »), nombre de relevés.
  - une grille de vignettes par grandeur (température de sol, humidité, luminosité, pluviométrie, tension…), avec l'icône, l'unité SI, la profondeur quand elle existe, et le verdict agronomique pour l'humidité — le même langage visuel que les fiches sondes du jardin.
  - si plusieurs trames sont arrivées dans l'heure, chaque grandeur montre sa dernière valeur, et une ligne « n trames · 15:07, 15:29, 15:52 » permet de basculer d'une trame à l'autre.
  - une heure sans relevé affiche « Silence — aucune trame reçue » plutôt qu'un panneau vide.
- Re-clic sur la même barre (ou touche Échap) referme le widget.

## Portée

- Même comportement partout où la frise est utilisée : Poste de contrôle admin, espaces partenaires (`/partenaire-iot/:slug`), page BRAD. Aucune donnée hors périmètre : les mesures sont lues avec les mêmes règles de portée que le reste de la console.

## Détails techniques

- `src/components/iot/VitalityStrip.tsx` : les barres deviennent des `<button>` (accessibles au clavier), avec props optionnelles `onSelectHour(index, from, to)` et `selectedIndex`. Sans ces props, le composant garde son comportement actuel — aucune régression sur les autres appelants.
- Nouveau composant `src/components/iot/HourMesuresWidget.tsx` : reçoit `capteurId`, `from`, `to` et affiche la grille.
- Nouveau hook `useMesuresInWindow(capteurId, fromISO, toISO)` dans `src/hooks/iot/useIotTelemetry.ts` : lecture `iot_mesures` bornée sur la fenêtre, groupée par `mesure_at` puis par grandeur ; requête à la demande (`enabled` uniquement quand une heure est sélectionnée) pour rester frugal.
- Réutilisation directe de `grandeurMeta`, `fmtMesure`, `fmtProfondeur`, `moistureVerdict` (`src/lib/iot/grandeurs.ts`) et du rendu de `MesureTile`.
- `TelemetryControl.tsx` : état local `{ capteurId, hourIndex }`, insertion du widget sous la frise de la sonde sélectionnée.
- Aucune modification de schéma ni de RLS : les tables et politiques existantes suffisent.
