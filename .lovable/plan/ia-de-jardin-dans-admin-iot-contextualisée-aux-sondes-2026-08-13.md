# IA de Jardin dans /admin/iot — contextualisée aux sondes

Amener l'IA de Jardin dans le poste de commandement IoT, avec un cadrage qui suit ce que l'administrateur regarde : une sonde sélectionnée, une propriété filtrée, ou l'ensemble du parc.

## 1. Cadrage automatique (« l'IA regarde ce que je regarde »)

Priorité de cadrage, recalculée en continu :

```text
sonde sélectionnée  >  propriété filtrée  >  parc entier (toutes propriétés)
```

Un bandeau en tête du chat annonce le périmètre courant — « Sonde Verger · Jardin Monde DEVIAT », « Jardin Monde DEVIAT · 3 sondes », ou « Parc entier · N sondes / M propriétés » — avec un bouton pour élargir au parc entier et un sélecteur de fenêtre temporelle (24 h / 7 j / 30 j) qui pilote les contextes agrégés.

## 2. Contextes IoT dans la Console 📎

Quatre contextes activables, chacun avec son coût affiché (même logique de frugalité que côté propriété) :

- **📡 Santé du réseau** — par sonde : batterie, RSSI/SNR, dernier signal, silence en heures, seuils, sondes sans GPS, cadence observée. Compact.
- **📊 Dernières mesures** — valeur courante par grandeur et profondeur, unités SI, âge de la mesure, signalement des valeurs hors plage plausible.
- **📈 Séries agrégées 30 j** — min / moyenne / max / écart-type, tendance (pente), nombre de relevés et trous de transmission par grandeur et profondeur. Aucun point brut n'est transmis.
- **🪨 Lecture agronomique croisée sol** — quand une propriété est cadrée : synthèse du registre de sol (texture, pH, matière organique, réserve utile, ICG) mise en regard des mesures d'humidité et de température, pour que l'IA parle irrigation et vie du sol, pas seulement télémétrie.

Quand le cadrage est « parc entier », les contextes sont agrégés par propriété puis par sonde, avec un plafond de volume : au-delà, l'IA reçoit les agrégats par propriété plus le détail des sondes en alerte.

## 3. Ancrage dans l'écran

- **Bouton flottant « IA de Jardin »** présent sur les quatre onglets d'`/admin/iot`.
- **Bouton « Interroger l'IA »** dans la fiche sonde du panneau latéral et dans l'Observatoire : il cadre l'IA sur cette sonde, active les contextes utiles et pré-remplit une question adaptée (« Cette sonde est-elle fiable ? », « Que disent ces courbes du sol du Verger ? »).
- **Suggestions d'entrée** selon le cadrage : diagnostic de fiabilité, lecture agronomique, sondes à aller voir en priorité, comparaison entre sondes d'une même propriété.

## 4. Garde-fous

L'IA ne répond qu'à partir des contextes activés : aucune valeur inventée, unités SI toujours citées, mention explicite quand une grandeur est absente (par exemple l'humidité de sol non transmise par certaines sondes) et quel contexte activer pour l'obtenir. Les anomalies connues de la chaîne BRAD (températures aberrantes, humidité en pourcentage hors bornes, profondeur absente) sont signalées comme telles plutôt que commentées comme des faits agronomiques.

## 5. Détails techniques

- Nouveau store de cadrage `src/components/iot/chatbot/iotChatFocus.ts` (même patron que `proprieteChatFocus`) : `capteurId`, `proprieteId`, `windowDays`, plus `openIotAi()`.
- Nouveau hook `src/hooks/iot/useIotChatProviders.ts` produisant les quatre `ContextProvider` à partir de `useAllCapteursGeo`, `useLatestMesures`, `useMesureSeriesRange` et — quand une propriété est cadrée — `usePropertySoil(..., { readOnly: true })` + `soilLiteFromState`. Agrégats calculés côté client, payloads chiffrés via `payloadBytes`.
- Nouveau composant de montage `src/components/iot/chatbot/IotChatBotMount.tsx` : réutilise `<ChatBot>` avec `edgeFunctionPath="propriete-chat"`, `assistantNameOverride="IA de Jardin"`, un `focusBanner` dédié (`IotFocusBanner.tsx`) et `chatPageContext.setAvailableAttachments`.
- `src/pages/AdminIot.tsx` monte le chatbot au niveau de la page ; `SensorsMapTab.tsx` et `SensorObservatory.tsx` publient leur sélection dans le store et exposent le bouton « Interroger l'IA ».
- Côté edge : `propriete-chat` reçoit un bloc de règles supplémentaire pour le mode télémétrie (lecture des unités, prudence sur les capteurs partiels) ; pas de nouvelle fonction, pas de changement de schéma.
- Aucun accès données nouveau : les hooks IoT existants et les RLS en place suffisent.
