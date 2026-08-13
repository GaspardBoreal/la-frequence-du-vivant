# Mutualiser le poste IoT : admin, page BRAD, et demain l'Atelier du jardin

Objectif : un seul socle de code « console des sondes », déclinable par périmètre et par niveau de droits. La page `/trust-in-frequence-vivant` devient la première déclinaison partenaire, avec trois onglets : **Accueil** (tout l'existant), **Poste de contrôle**, **Carte des sondes** — plus l'IA de Jardin cadrée sur les sondes BRAD.

## 1. Ce que verra BRAD

- **Accueil** — la page actuelle, inchangée : jauges de conformité, les trois sondes, grandeurs reçues/manquantes, anomalies, demandes, exports Markdown, Table ronde des IA.
- **Poste de contrôle** — bandeau « signal en direct », les cinq compteurs 24 h, la vitalité 48 h sonde par sonde avec le bouton **Trame de test**, et le Journal des livraisons complet (filtres, pagination, payload brut). Restreint aux sondes BRAD.
- **Carte des sondes** — carte satellite/plan des trois sondes, pastilles colorées par état de santé, médaillon photo en situation, liste latérale filtrable, fiche sonde au clic, et l'Observatoire (tous les graphes, périodes 24 h → 1 an, export CSV).
- **IA de Jardin** — bouton flottant sur les trois onglets, cadrée d'office sur le parc BRAD, avec les contextes télémétrie **et** la lecture agronomique croisée du sol (comme décidé).

Un liseré et un bandeau d'en-tête rappellent le périmètre : « BRAD Technology · 3 sondes ». Aucune sonde d'un autre fournisseur, aucune autre propriété n'apparaît jamais.

## 2. Accès : compte partenaire connecté

BRAD reçoit un compte nominatif porteur d'un rôle **partenaire fournisseur**, rattaché à BRAD Technology. Ce compte donne accès en lecture à la télémétrie de ses sondes uniquement, plus la trame de test. Il ne donne accès à rien d'autre du produit.

La page `/trust-in-frequence-vivant` reste accessible par mot de passe pour l'onglet **Accueil** (rapport de confiance, déjà calculé par une fonction sécurisée). Les onglets Poste de contrôle et Carte n'apparaissent que si un compte partenaire (ou administrateur) est connecté ; sinon un encart invite à se connecter. Rien de la protection actuelle n'est retiré.

## 3. Mutualisation du code

Le cœur est extrait en un **kit console IoT** neutre, piloté par un objet de périmètre unique :

```text
IotConsoleScope = {
  fournisseurIds? | proprieteIds? | capteurIds?   ← ce qu'on regarde
  capabilities: { testDelivery, rawPayload, catalogue, gpsEdit, ai }
  chrome: 'admin' | 'partenaire' | 'jardin'       ← habillage
}
```

Trois consommateurs, un seul code :

| Page | Périmètre | Droits |
|---|---|---|
| `/admin/iot` | tout le parc | tout, y compris catalogue |
| `/trust-in-frequence-vivant` | fournisseur BRAD | lecture + trame de test |
| Atelier du jardin (plus tard) | une propriété | lecture + pose GPS |

## 4. Détails techniques

**Base de données**
- Table `iot_partner_users` (`user_id`, `fournisseur_id`, `actif`) + fonction `SECURITY DEFINER` `public.is_iot_partner_of_fournisseur(_user, _fournisseur)` et `public.iot_partner_fournisseur_ids(_user)`.
- Extension des policies existantes en **ajout** (aucune policy retirée) :
  - `iot_capteurs` : lecture si le type du capteur appartient à un fournisseur du partenaire.
  - `iot_mesures` : idem via jointure capteur.
  - `iot_capteur_photos` : idem, lecture seule.
  - `iot_webhook_deliveries` : lecture si `fournisseur` correspond, ou serial rattaché à un capteur du partenaire (aujourd'hui admin seulement).
- GRANTs explicites sur la nouvelle table (`authenticated`, `service_role`).
- Edge `iot-test-delivery` : autoriser aussi un partenaire pour ses propres sondes (contrôle serveur, jamais côté client).

**Front — nouveaux fichiers**
- `src/components/iot/console/IotConsoleContext.tsx` : provider du périmètre + droits (`useIotConsoleScope()`).
- `src/components/iot/console/IotConsole.tsx` : orchestrateur d'onglets (Poste de contrôle / Carte / Catalogue), les onglets étant filtrés par `capabilities`.
- `src/components/iot/console/index.ts` : point d'entrée unique.

**Front — refactorisations (comportement inchangé sur `/admin/iot`)**
- `useIotTelemetry.ts` : chaque hook (`useAllCapteurs`, `useAllCapteursGeo`, `useTelemetryPings`, `useTelemetryDeliveriesPaged`, `useDeliverySerials`…) accepte un filtre de périmètre optionnel, lu par défaut depuis le contexte console. Les clés React Query intègrent le périmètre pour éviter tout mélange de caches.
- `TelemetryControl.tsx`, `SensorsMapTab.tsx`, `SensorObservatory.tsx`, `DeliveryJournal.tsx` : lisent le périmètre et les droits du contexte au lieu de requêter globalement ; `Trame de test`, payload brut et lien « propriété » deviennent conditionnels.
- `iotChatFocus.ts` : ajout d'un périmètre racine (les changements de cadrage ne peuvent pas sortir du périmètre partenaire) ; `useIotChatProviders.ts` borne `useAllCapteursGeo` au même périmètre.
- `IotChatBotMount.tsx` : accepte `fabLabel`/habillage et le périmètre, sans duplication.
- `AdminIot.tsx` : devient une coquille — en-tête admin + `<IotConsole scope={parcEntier} />` + onglet Catalogue conservé.
- `TrustInFrequenceVivant.tsx` : le contenu actuel est déplacé tel quel dans `TrustAccueilTab.tsx` ; la page monte `Tabs` (Accueil / Poste de contrôle / Carte) et enveloppe les deux nouveaux onglets dans le provider de périmètre BRAD, avec l'IA montée au niveau page.

**Garde-fous**
- Le filtrage n'est jamais seulement côté client : les RLS ci-dessus font foi, le périmètre front n'est qu'un confort d'affichage.
- Aucun changement d'URL, `noindex` conservé, mot de passe conservé.
- L'onglet Catalogue reste strictement administrateur.

## 5. Étapes

1. Migration base : table partenaire, fonctions, policies additives, GRANTs.
2. Extraction du kit console + périmètre dans les hooks, `/admin/iot` refactorisé à comportement identique (vérification visuelle).
3. Onglets Accueil / Poste de contrôle / Carte dans la page BRAD + IA cadrée BRAD.
4. Création du compte partenaire BRAD et vérification bout en bout (une sonde d'une autre propriété doit rester invisible).
