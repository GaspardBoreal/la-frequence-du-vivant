---
name: Capteurs et sondes (IoT)
description: Chaîne IoT complète — catalogue admin (fournisseurs/types), capteurs par propriété, webhook Brad signé HMAC, mesures en unités SI, pose GPS dans l'Atelier du jardin
type: feature
---
Chaîne IoT de bout en bout, unités toujours normalisées SI (°C, %, Pa, lx, mm, V).

- Tables : `iot_fournisseurs`, `iot_types_capteurs`, `iot_capteurs`, `iot_mesures`,
  `iot_webhook_deliveries`. RLS adossée à `can_access_propriete`.
- Réception : edge `iot-webhook-brad` (HMAC-SHA256, en-tête `X-Brad-Signature`,
  secret `BRAD_WEBHOOK_SECRET`), déduplication par `(fournisseur, delivery_id)` et
  contrainte unique `NULLS NOT DISTINCT` sur les mesures. Import d'historique :
  `iot-import-brad-history`.
- Admin : `/admin/iot` (`src/pages/AdminIot.tsx`) — CRUD fournisseurs et types
  (famille, profondeurs en m stockées, saisies en cm, grandeurs). Raccourci dans
  le hub Admin Outils.
- Propriété : onglet « Capteurs et sondes » (`SensorsSection`), encadré de deux
  traits verts dans le menu « Mon projet », entre Atelier du jardin et Clinique.
  Fiche capteur `SensorDrawer` : dernières mesures, tendance 30 j, verdict
  agronomique, lien IA de Jardin.
- Atelier du jardin : vue de fond « Capteurs et sondes » (`IotLayer` + `IotDock`),
  pose au clic pour les capteurs sans GPS, pastille glissable ensuite
  (`useMoveCapteur`, écriture chirurgicale lat/lng optimiste).
- Premier déploiement : BRAD TECHNOLOGY (France), 3 sondes de sol 5/15, 5/30,
  30/60 sur « Jardin Monde DEVIAT ».

Fichiers : `src/lib/iot/grandeurs.ts`, `src/hooks/iot/useIot.ts`,
`src/components/propriete/iot/**`.
- Photos « en situation » : table `iot_capteur_photos` (bucket `propriete-tests`,
  préfixe `<propriete_id>/iot/<capteur_id>/`), RPC `reorder_iot_capteur_photos`,
  bande photo dans `SensorDrawer` (`SensorPhotoStrip` + `SensorPhotoViewer`),
  médaillon de couverture dans la bulle du plan et sur les cartes de veille.
- Fiches ouvertes depuis l'Atelier (z-[3000]) : passer `elevated` au drawer, sinon le
  Sheet (z-[1100]) reste invisible derrière le plein écran.

