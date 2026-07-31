# IA de Jardin — Console de contextes frugale

## Lecture de vos réponses

Vous avez choisi **aucune persistance** pour la conversation et **base de données** pour le stockage. Je les combine ainsi :
- la **conversation** reste en session (elle disparaît au rechargement, comme le chatbot actuel de Mon espace) ;
- ce qui est **sauvegardé en base**, ce sont les **préréglages de contexte** (« recettes » réutilisables) et les **propositions exportées** (palettes proposées par l'IA, archivées en lecture seule).

Si vous préférez aussi archiver les conversations, dites-le et j'ajoute la table.

---

## Le principe : l'IA ne voit que ce que vous lui donnez

Aujourd'hui le chatbot reçoit automatiquement « ce qui est à l'écran ». Pour une propriété, ça serait énorme (des centaines d'espèces, 5 carottes de sol, des dizaines d'ouvrages) et coûteux en tokens.

On inverse la logique : **par défaut, l'IA ne reçoit qu'une carte d'identité minuscule de la propriété** (nom, surface, commune, nombre d'ouvrages, nombre de prélèvements, nombre d'espèces — ~300 octets). Tout le reste est **chargé à la demande, en un clic**, via une **Console de contextes**.

```text
┌─ CONSOLE DE CONTEXTES ──────────────── 1,8 Ko · ~450 tokens ─┐
│                                                              │
│  PÉRIMÈTRE     ( • Propriété entière )  ( Ouvrage : Massif ) │
│                 Rayon autour de l'ouvrage : ──●──── 25 m     │
│                                                              │
│  🌿 Vivant        [ Aucun ][ Résumé ][• Liste ][ Détail ]    │
│  🧪 Sol           [ Aucun ][• Synthèse ][ Carottes A/B/C ]   │
│  🏗️ Ouvrages      [ Aucun ][• Celui-ci ][ Tous ]             │
│  🗺️ Site          [ Aucun ][• Portrait ] (cadastre, zones)   │
│  📖 J'observe     [ Aucun ][ Carnet scellé ]                 │
│  🌱 J'identifie   [ Aucun ][ Cortège + ICG ]                 │
│                                                              │
│  ◇ Recettes : « Palette massif » · « Diagnostic complet »    │
└──────────────────────────────────────────────────────────────┘
```

Chaque bascule affiche **son propre poids** avant activation. La jauge du haut agrège en temps réel : poids, tokens estimés, et un **éco-score** (Frugal / Mesuré / Copieux) avec un conseil quand on charge trop.

---

## L'usage cible que vous décrivez

1. Sur la carte Atelier, clic droit / bouton **« Interroger l'IA »** sur le Massif.
2. La console s'ouvre **pré-réglée** : périmètre = Massif, rayon 25 m, Vivant = Liste, Sol = les carottes liées à cet ouvrage, Ouvrages = celui-ci. Poids ≈ 2 Ko.
3. Deux suggestions apparaissent : **« Palette sol vivant »** et **« Palette jardin nourricier »**.
4. L'IA répond avec une palette argumentée (indigénat, strates, concordance sol, compagnonnage), imprimable et exportable.

---

## Un seul chatbot, factorisé

On **n'écrit pas** un second chatbot. Le composant `ChatBot.tsx` (impression, plein écran, vocal, upload de fichier, export, FAB) est **conservé tel quel** et rendu générique :

- il reçoit désormais une **liste de « providers de contexte »** au lieu du seul pool d'espèces ;
- le bouton 📎 existant devient le point d'entrée de la **Console de contextes** (drawer riche sur desktop, feuille plein écran sur mobile), tout en gardant l'upload de document ;
- le fichier `chatConfig.ts` gagne un contexte `propriete` (nom d'assistant, suggestions, branding d'impression « Jardin »).

Résultat : les fonctions d'impression / vocal / export / grand écran sont **immédiatement disponibles** dans l'IA de jardin, sans duplication.

---

## Frugalité côté serveur aussi

Une nouvelle edge function `propriete-chat` :
- **vérifie les droits** sur la propriété (le contexte demandé ne peut pas dépasser ce que l'utilisateur a le droit de voir) ;
- **ne recharge pas** ce que le client a déjà envoyé : le client envoie des *sélecteurs* (« sol : carottes A et C », « vivant : rayon 25 m autour de l'ouvrage X »), le serveur assemble via des RPC ciblées et renvoie le **poids réellement consommé**, affiché ensuite dans la jauge ;
- **compacte** systématiquement (noms d'espèces abrégés, valeurs sol normalisées, pas de JSON verbeux) ;
- **plafonne** chaque bloc (ex. 200 espèces) et signale la troncature à l'IA ;
- garde-fous anti-hallucination repris de `community-chat` : interdiction de citer une espèce absente du contexte.

Modèle : `google/gemini-3.6-flash` (rapide, peu coûteux), avec passage automatique à un modèle plus fort uniquement quand le contexte dépasse un seuil (simulation, prédiction).

---

## Ce qui est construit

**Étape A — Socle factorisé**
- Généralisation du système d'attachements du chatbot (providers déclaratifs).
- Console de contextes : jauge, bascules, périmètre, rayon, recettes.
- Composant rayon **factorisé** depuis `RadiusSelector` / `RadiusPresetPopover` de Mon espace (mêmes presets).

**Étape B — Contextes propriété**
- 6 builders frugaux branchés sur les hooks existants (`usePropertySpeciesPool`, `usePropertySoil`, `usePropertyObjets`, `usePropertyZones`, `usePropertyFloraMatched`, `usePropertyObservation`, `usePropertySynthesis`), avec filtrage spatial (cadastre / ouvrage / rayon) réutilisant `geofence.ts` et `speciesRadiusFilter.ts`.

**Étape C — Edge function + intégration UI**
- `propriete-chat` avec contrôle d'accès et assemblage frugal.
- Montage du chatbot sur `/propriete/:slug` (tous les onglets), entrées « Interroger l'IA » sur l'inspecteur d'ouvrage, la fiche carotte et la palette.

**Étape D — Recettes & propositions**
- Tables `propriete_ia_presets` (recettes de contexte) et `propriete_ia_propositions` (palettes proposées, archivées, exportables), avec RLS calquée sur `can_access_propriete`.
- Export PDF de la proposition via le moteur d'impression du chatbot.

## Détails techniques

- Aucun changement au flux SSE existant (`useChatStream`) : on ajoute seulement un champ `contextSelectors` au corps de requête et on lit un en-tête de coût dans la réponse.
- L'IA reste **en lecture seule** : elle propose, l'utilisateur exporte ou recopie ; aucune écriture automatique dans `propriete_palette` ou `propriete_objets`.
- Estimation tokens : heuristique locale (octets / 3,6) affichée en « ~N tokens », recalée par la valeur réelle renvoyée par la edge function après chaque échange.
