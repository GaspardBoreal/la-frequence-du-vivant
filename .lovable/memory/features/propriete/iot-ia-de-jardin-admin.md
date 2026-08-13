---
name: IA de Jardin dans le poste IoT (/admin/iot)
description: Chatbot IA de Jardin contextualisé aux sondes — cadrage sonde > propriété > parc, 4 contextes frugaux, mode télémétrie côté edge propriete-chat
type: feature
---
Dans `/admin/iot`, l'IA de Jardin raisonne sur la télémétrie, pas sur une seule propriété.

- Cadrage : store `src/components/iot/chatbot/iotChatFocus.ts` (`capteurId`,
  `proprieteId`, `windowDays`). Il suit ce que l'admin regarde : sélection d'une
  sonde sur la carte, filtre propriété, sinon parc entier. `openIotAi()` ouvre le
  chat cadré avec une question pré-remplie (fiche sonde + Observatoire).
- Contextes (`src/hooks/iot/useIotChatProviders.ts`) : 📡 santé réseau,
  📊 dernières mesures, 📈 séries agrégées sur la fenêtre, 🪨 lecture croisée sol.
  Les deux premiers sont auto-activés ; les autres via la Console 📎.
- Montage : `IotChatBotMount` + `IotFocusBanner`, edge `propriete-chat`.
- Edge : `pageState.filters.iotAdmin === true` autorise l'absence de propriété,
  sous réserve de `check_is_admin_user` ; ajoute `TELEMETRY_ADDENDUM` (unités,
  profondeurs, valeurs suspectes ≠ fait agronomique, fiabilité vs agronomie).
