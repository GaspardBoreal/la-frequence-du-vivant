

# Compagnon IA pédagogique dans l'onglet Quiz

## Problème

Quand le marcheur a terminé le quiz, il voit un écran mort : "Quiz complété ! De nouvelles questions arrivent bientôt !" — aucune suite, aucune interaction, aucun moyen de progresser. L'écran gaspille l'élan d'apprentissage.

## Solution

Remplacer l'écran "Quiz complété" par un **espace d'apprentissage vivant** avec un compagnon IA intégré, en réutilisant l'infrastructure existante (Lovable AI Gateway via une edge function dédiée).

### Layout proposé

```text
┌──────────────────────────────────────┐
│ 🏆 Bravo ! Quiz maîtrisé            │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 🔄 Réviser ce quiz              │ │
│ │ Refaire les questions en mode   │ │
│ │ entraînement (sans Fréquences)  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 🌿 Votre compagnon d'éveil      │ │
│ │                                  │ │
│ │ Que souhaitez-vous explorer ?    │ │
│ │                                  │ │
│ │ [Identifier les chants oiseaux]  │ │
│ │ [Comprendre un écosystème]       │ │
│ │ [Écrire de la géopoétique]      │ │
│ │                                  │ │
│ │ ┌────────────────────────────┐   │ │
│ │ │ 💬 Posez votre question... │   │ │
│ │ └────────────────────────────┘   │ │
│ │                                  │ │
│ │ (conversation IA ici)            │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

## Fonctionnalités

1. **Mode révision** : Bouton pour refaire le quiz sans regagner de Fréquences — reset l'état `alreadyAnswered` localement
2. **Suggestions thématiques** : 3 boutons rapides alignés sur les piliers (biodiversité, bioacoustique, géopoétique) qui pré-remplissent le chat
3. **Mini-chat IA** : Conversation avec un compagnon pédagogique spécialisé dans les 3 piliers, qui peut recommander des marches à venir et des axes d'apprentissage

## Modifications techniques

| Fichier | Changement |
|---------|-----------|
| `supabase/functions/quiz-companion-chat/index.ts` | **Nouveau** — Edge function avec system prompt pédagogique spécialisé biodiversité/bioacoustique/géopoétique, streaming SSE via Lovable AI Gateway |
| `src/hooks/useQuizCompanion.ts` | **Nouveau** — Hook de chat streaming (pattern identique à `useGuideDeMarche.ts`) |
| `src/components/community/QuizCompanion.tsx` | **Nouveau** — Widget chat compact avec suggestions rapides et historique de conversation |
| `src/components/community/QuizInteractif.tsx` | Remplacer l'écran "Quiz complété" (lignes 155-164) par le bouton révision + le composant `QuizCompanion` |
| `src/components/community/tabs/QuizTab.tsx` | Aucun changement nécessaire |
| `supabase/config.toml` | Ajouter la config de la nouvelle edge function |

### System prompt du compagnon

Le prompt inclura :
- Expertise sur les 3 piliers (biodiversité, bioacoustique, géopoétique)
- Connaissance des marches du Vivant et de leur format pédagogique (les 4 temps)
- Capacité à recommander des axes d'apprentissage personnalisés
- Ton inspirant et poétique, cohérent avec l'esprit du projet
- Réponses courtes et engageantes (max 150 mots)

### Mode révision

Simple reset de l'état local `alreadyAnswered` avec un flag `isRevisionMode` qui empêche l'enregistrement de nouvelles `quiz_responses` et l'attribution de Fréquences.

