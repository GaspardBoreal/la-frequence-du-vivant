# Plusieurs heures ouvertes en même temps — Poste de contrôle IoT

Aujourd'hui une seule heure peut être ouverte : cliquer sur une barre d'une autre sonde referme la précédente. On passe à une lecture multi-sondes, avec une fermeture globale en un clic.

## Ce que voit l'utilisateur

- Chaque sonde garde sa propre heure ouverte : ouvrir « Sonde Potager d'Hiver » ne referme plus « Sonde Potager d'Été ». On peut comparer deux (ou trois) créneaux côte à côte, dans le fil des sondes.
- Re-cliquer sur la même barre referme son widget (comportement actuel conservé) ; la croix du widget aussi.
- Un bouton discret apparaît dans l'en-tête de la section « Vitalité des sondes » dès qu'au moins un widget est ouvert : « Tout refermer (n) ». Un clic, tout se replie. La touche Échap fait la même chose : elle referme tout.
- Dans l'en-tête de chaque sonde ayant une heure ouverte, une pastille rappelle le créneau lu (ex. « 15 h → 16 h »), pour ne pas se perdre quand plusieurs sont dépliés.

## Détails techniques

- `src/components/iot/TelemetryControl.tsx` : l'état `openHour` (objet unique) devient `openHours: Record<capteurId, { index, from, to }>`. Le clic sur une barre bascule uniquement l'entrée de cette sonde ; `selectedIndex` et le montage du widget lisent `openHours[c.id]`. Nouveau bouton « Tout refermer » dans le titre de section, actif si `Object.keys(openHours).length > 0`.
- `src/components/iot/HourMesuresWidget.tsx` : retirer le listener global `Escape` du widget (sinon n instances se ferment de façon désordonnée) ; l'Échap est géré une seule fois dans `TelemetryControl` et vide tout l'état.
- `VitalityStrip.tsx` : aucun changement — son API `selectedIndex` / `onSelectHour` suffit déjà.
- Bénéfice frugalité : chaque widget ouvert déclenche sa requête `useMesuresInWindow` bornée à l'heure, donc le coût reste proportionnel au nombre de widgets réellement ouverts.
- Aucun changement de schéma, de RLS, ni de périmètre : le comportement est identique dans `/admin/iot`, `/partenaire-iot/:slug` et la page BRAD.
