

# Chatbot "Guide de Marche" — connecte aux donnees du detecteur de zones blanches

## Vue d'ensemble

Un chatbot IA contextuel integre dans la page `/marches-du-vivant/explorer`, specialise dans l'accompagnement operationnel des ambassadeurs pour organiser leurs Marches du Vivant. Il recoit en contexte **l'integralite des resultats du detecteur de zones blanches** (grille, observations, especes, noms de lieux) et utilise le Lovable AI Gateway (Gemini) pour generer des reponses pratico-pratiques.

## Architecture

```text
┌─────────────────────────────────────┐
│  DetecteurZonesBlanches.tsx          │
│  (resultats du scan)                │
│         ↓ props                     │
│  GuideDeMarche (chatbot flottant)   │
│    ├── streaming SSE                │
│    ├── export PDF conversation      │
│    └── suggestions rapides          │
│         ↓ fetch streaming           │
│  Edge Function: guide-marche-chat   │
│    ├── system prompt riche          │
│    ├── contexte zones injecte       │
│    └── Lovable AI Gateway (Gemini)  │
└─────────────────────────────────────┘
```

## Composants a creer/modifier

### 1. Edge Function `supabase/functions/guide-marche-chat/index.ts`

- Recoit: `{ messages[], zonesContext }` 
- `zonesContext` = le resultat complet du detecteur (zones, especes, centre, phases)
- Construit un **system prompt expert** qui inclut:
  - Toutes les zones scannees avec label, observations, especes, coordonnees, resolution
  - Les 4 sequences pedagogiques (biodiversite, bioacoustique, marche geopoetique, methodes d'observation) avec duree de 15 min chacune
  - La connaissance de l'experience narrative (Accordage, Marche des Capteurs, Eclosion Geopoetique, Banquet des Retours)
  - Des instructions pour recommander des points de ralliement (parkings, places), des parcours en boucle, et une organisation temporelle detaillee
- Appelle `https://ai.gateway.lovable.dev/v1/chat/completions` en streaming avec `google/gemini-2.5-flash`
- Gere les erreurs 429/402

### 2. Composant `src/components/zones-blanches/GuideDeMarche.tsx`

- Chatbot flottant (bouton en bas a droite, style similaire a DordoniaChat mais aux couleurs emeraude/nature)
- **N'apparait que quand des resultats de scan existent** (le bouton est masque tant qu'aucun scan n'est termine)
- Streaming token-by-token avec ReactMarkdown
- **Suggestions rapides pre-remplies** (chips cliquables):
  - "Ou se garer pour cette marche ?"
  - "Propose un parcours de decouverte"
  - "Organise une marche de 2h avec 4 sequences pedagogiques"
  - "Quelles especes observer en priorite ?"
- Bouton "Exporter en PDF" dans le header

### 3. Export PDF de la conversation

- Utilise `@react-pdf/renderer` (deja installe)
- Design "Les Marches du Vivant" : fond vert degrade, typographie Crimson
- En-tete avec logo/titre, date, lieu du scan
- Messages formulates en blocs question/reponse
- Pied de page avec pagination

### 4. Hook `src/hooks/useGuideDeMarche.ts`

- Gere l'etat messages, streaming SSE, envoi
- Recoit les `DetectionResult` en parametre et les passe au backend a chaque message
- Expose: `messages`, `isLoading`, `sendMessage(text)`, `resetSession()`

### 5. Modifications existantes

- **`DetecteurZonesBlanches.tsx`** : expose les resultats via un callback `onResultsReady?(results: DetectionResult)` pour que le parent puisse les transmettre au chatbot
- **`MarchesDuVivantExplorer.tsx`** : integre le `GuideDeMarche` et lui passe les resultats du detecteur
- **`supabase/config.toml`** : ajouter `[functions.guide-marche-chat]` avec `verify_jwt = false`

## System prompt de l'edge function (extrait cle)

Le prompt injectera dynamiquement les donnees et contiendra des instructions comme :

- "Tu es le Guide des Marches du Vivant, un assistant expert en organisation de marches de decouverte de la biodiversite"
- "Voici les donnees du territoire scanne : [zones JSON]. Les zones 'Silence' (0 observations) sont les zones blanches prioritaires."
- "Les 4 sequences pedagogiques durent 15 minutes chacune : 1) Biodiversite (fondamentaux), 2) Bioacoustique (ecoute des sons), 3) Marche geopoetique (ecriture sensorielle), 4) Methodes d'observation (protocoles citoyens)"
- "Pour les points de ralliement, suggere des lieux accessibles en voiture pres du centre de scan. Mentionne les routes departementales et communales visibles sur les cartes."
- "Propose toujours des parcours en boucle de 4-8 km, en privilegiant les zones 'Silence' et 'Murmure'"
- "Sois tres pratico-pratique : horaires, durees, pauses, materiel a prevoir"

## Fichiers crees/modifies

| Fichier | Action |
|---------|--------|
| `supabase/functions/guide-marche-chat/index.ts` | Creer |
| `supabase/config.toml` | Modifier (ajouter entry) |
| `src/hooks/useGuideDeMarche.ts` | Creer |
| `src/components/zones-blanches/GuideDeMarche.tsx` | Creer |
| `src/components/zones-blanches/GuideDeMarchePdf.tsx` | Creer |
| `src/components/zones-blanches/DetecteurZonesBlanches.tsx` | Modifier (callback) |
| `src/pages/MarchesDuVivantExplorer.tsx` | Modifier (integration) |

