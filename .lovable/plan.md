## Diagnostic

Le bouton « Cadrer l'IA sur cet ouvrage » ne fait que poser un *focus* (`proprieteChatFocus.setObjet`). Ce focus change le **contenu** des contextes construits par `useProprieteChatProviders` (le provider `ouvrage.focus` apparaît, le vivant est filtré au rayon), mais **n'active aucun contexte** : l'activation se fait uniquement à la main dans la Console (trombone), et l'edge function `propriete-chat` n'envoie que `pageState.visibleData`.

Résultat visible en copie 2 : l'IA répond « aucun contexte n'est activé » alors que le massif est bien sélectionné.

## Correction proposée

1. **Auto-activation au cadrage**
   Quand on cadre l'IA sur un ouvrage, publier automatiquement les slices recommandées dans `visibleData` :
   - `ctx.ouvrage.focus` (dossier de l'ouvrage : mesures, sol relié, contraintes)
   - `ctx.sol.synthese` si des prélèvements existent
   - `ctx.vivant.resume` filtré au rayon d'écoute
   Implémenté dans `ProprieteChatBotMount.tsx` : un effet qui, à chaque changement de `focus.objetId` / `focus.radiusM`, republie ces slices (et les retire quand on revient à la propriété entière). Les slices restent visibles et désactivables dans la Console — l'utilisateur garde la main.

2. **Rayon d'écoute réellement répercuté**
   Le changement de rayon (bandeau du chat ou inspecteur) reconstruit les payloads : republication des slices actives pour que la conversation suivante parte avec le bon périmètre.

3. **Feedback explicite dans le chat**
   `GardenFocusBanner` affiche, sous le nom de l'ouvrage, les contextes réellement transmis (`🏗️ ouvrage · 🪨 sol · 🌿 vivant — N octets`) avec un lien « ouvrir la Console » pour ajuster. L'utilisateur voit d'un coup d'œil ce que l'IA reçoit.

4. **Message d'ouverture cadré**
   Quand `openGardenAi` est appelé avec un ouvrage, injecter une ligne de cadrage en tête du prompt pré-rempli (« Ouvrage cadré : Massif couvert, rayon 25 m ») pour que même une question libre soit ancrée.

5. **Garde côté serveur**
   Dans `propriete-chat`, si `visibleData` est vide mais qu'un ouvrage est cadré (`pageState.focus`), la réponse d'invitation mentionne le bouton « Cadrer l'IA sur cet ouvrage » plutôt qu'un simple renvoi générique à la Console.

## Détails techniques

- Frugalité préservée : seules 1 à 3 slices compactes (résumé, pas la liste complète des espèces) sont auto-activées ; la liste détaillée et les autres contextes restent manuels.
- Aucune requête réseau supplémentaire : tout est calculé depuis les hooks déjà montés.
- Fichiers touchés : `ProprieteChatBotMount.tsx`, `GardenFocusBanner.tsx`, `proprieteChatFocus.ts`, `useProprieteChatProviders.ts` (exposer les ids recommandés), `supabase/functions/propriete-chat/index.ts`.
