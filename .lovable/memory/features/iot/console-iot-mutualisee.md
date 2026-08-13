---
name: Console IoT mutualisée (admin / partenaire / jardin)
description: Kit unique des sondes piloté par IotConsoleProvider (périmètre + capacités), réutilisé par /admin/iot et la page partenaire BRAD
type: feature
---

Un seul socle de code sert toutes les lectures des sondes.

- `src/components/iot/console/IotConsoleContext.tsx` : `IotConsoleProvider` porte `scope`
  (`fournisseurIds`, `fournisseurKeys` = noms dans `iot_webhook_deliveries` comme « brad »,
  `proprieteIds`, `capteurIds`), `capabilities` (`testDelivery`, `rawPayload`, `catalogue`,
  `proprieteLinks`, `ai`), `chrome` ('admin' | 'partenaire' | 'jardin') et `label`.
- Tous les hooks de `useIotTelemetry.ts` filtrent sur ce périmètre et intègrent `scopeKey`
  dans les clés React Query. Le périmètre n'est qu'un confort d'affichage : la vérité d'accès
  reste dans les RLS (`iot_partner_users` + fonctions SECURITY DEFINER de scoping fournisseur).
- `IotConsolePanel` (vue 'controle' | 'carte') et `IotConsoleAi` (IA de Jardin cadrée) sont les
  points de montage ; `/admin/iot` = parc entier toutes capacités, `/trust-in-frequence-vivant`
  = onglets Accueil / Poste de contrôle / Carte, périmètre BRAD, sans trame de test ni payload brut.
- Accès partenaire : `useIotPartnerAccess` / `useCanOpenIotConsole(fournisseurId)` — admin ou
  partenaire actif du fournisseur. Les onglets interactifs de la page BRAD exigent une connexion,
  le rapport « Accueil » reste protégé par mot de passe seul.
- Prochain réemploi prévu : l'Atelier du jardin (scope `proprieteIds`).
