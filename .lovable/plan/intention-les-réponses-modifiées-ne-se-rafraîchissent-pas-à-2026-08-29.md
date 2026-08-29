# Intention — les réponses modifiées ne se rafraîchissent pas à l'écran

## Ce qui est vérifié

- L'écriture arrive bien en base : la propriété « Les Hortensias » porte des réponses cohérentes avec un enregistrement de 21:19 (heure de Paris). La RPC `save_propriete_onboarding` fusionne correctement et refuse proprement si l'utilisateur n'a pas le droit. Le problème est donc côté affichage, pas côté sauvegarde.
- Bug confirmé par lecture du code : dans `IntentionQuestionEditor`, le brouillon local n'est réinitialisé que lorsqu'on ouvre une question **différente** (`if (question && key !== question.id)`). Rouvrir la **même** question après un enregistrement réaffiche l'ancien brouillon, jamais la valeur relue en base. C'est exactement la sensation « ma modification n'est pas prise en compte ».
- Après enregistrement, le rafraîchissement des cartes repose uniquement sur une invalidation de cache asynchrone (`invalidateQueries`) : le panneau se ferme avant que la relecture ne soit revenue, donc les cartes « Qui êtes-vous », « Votre lieu », « Vos envies » restent un instant — parfois durablement si la relecture échoue en silence — sur l'ancienne valeur. La RPC renvoie pourtant déjà le jsonb complet à jour, aujourd'hui ignoré.

## Ce qui sera fait

1. **Le panneau d'édition repart toujours des valeurs réelles.** Réinitialiser le brouillon à chaque ouverture du panneau (et non seulement au changement de question), et le resynchroniser si les réponses relues changent pendant l'ouverture.
2. **Mise à jour immédiate de l'écran.** La sauvegarde exploite le jsonb renvoyé par `save_propriete_onboarding` pour réécrire directement le cache de lecture : les cartes affichent la nouvelle réponse dès la fermeture du panneau, sans attendre l'aller-retour réseau. La relecture reste déclenchée derrière, en filet de sécurité.
3. **Plus d'échec muet.** Si la relecture ou l'écriture échoue, l'erreur est remontée (message d'erreur) au lieu de laisser une valeur périmée à l'écran.

## Détails techniques

- `src/components/propriete/portrait/IntentionQuestionEditor.tsx` : remplacer la garde `key !== question.id` par une garde sur la transition fermé → ouvert + dépendance aux valeurs entrantes.
- `src/hooks/propriete/usePropertyIntention.ts` : la RPC retourne `jsonb` ; typer ce retour, appliquer `qc.setQueryData(['propriete-intention', id], normalize(data))` dans `onSuccess`, puis `invalidateQueries`. Même traitement pour `useSaveGardenExample`.
- Aucun changement de base de données, aucune URL touchée.
