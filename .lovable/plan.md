## Objectif

Les 4 suggestions « propriété » de l'IA de Jardin doivent parler de la **propriété entière** et activer d'elles-mêmes les contextes nécessaires, même si l'utilisateur n'a rien coché dans la Console de contextes.

## 1. Renommage des suggestions (`src/components/chatbot/ChatSuggestions.tsx`)

| Avant | Après |
|---|---|
| Propose une palette végétale pour cet ouvrage | Propose une palette végétale pour **cette propriété** |
| Que disent les analyses de sol reliées ? | **Que disent les analyses de sol ?** |
| Quelles espèces indigènes privilégier ici ? | inchangé |
| Quelles précautions pour cet aménagement ? | Quelles précautions pour **cette propriété** ? |

## 2. Contextes exigés par question

Chaque suggestion `propriete` porte désormais une liste d'identifiants de contexte à activer avant l'envoi :

- Palette végétale → `vivant.liste`, `sol.carottes`, `site.portrait`
- Analyses de sol → `sol.carottes`, `site.portrait`
- Espèces indigènes → `vivant.liste`, `sol.carottes`, `site.portrait`
- Précautions → `vivant.liste`, `sol.carottes`, `site.portrait` **+ tout le Plateau des ouvrages en profondeur « Complet »**

(`vivant.liste` = Liste complète des espèces, `sol.carottes` = Détail des prélèvements, `site.portrait` = Portrait du site.)

## 3. Mécanique d'activation

Nouvel utilitaire `src/lib/chatSuggestionContexts.ts` :

- lit les `providers` publiés dans `chatPageContext.availableAttachments` ;
- pour chaque id demandé et disponible, appelle `chatPageContext.setVisibleSlice(contextSliceKey(id), payload)` — exactement le même chemin que la Console, donc l'UI affiche bien ces contextes comme actifs (chips + compteur) ;
- ne désactive jamais ce que l'utilisateur avait déjà coché (union, pas remplacement) ;
- ignore silencieusement un contexte absent (ex. aucune carotte posée) — la réponse reste possible avec le reste.

Cas particulier « Précautions » (Plateau des ouvrages) :
- `proprieteChatFocus.setOuvrageDetail('complet')` ;
- `proprieteChatFocus.setSelectedObjets(<tous les ids d'ouvrages>)` — les ids viennent du payload/registre déjà exposé, sinon via le provider `ouvrages.selection` reconstruit ;
- le `ProprieteChatBotMount` publie déjà automatiquement la slice `ouvrages.selection` dès que la sélection est non vide, donc aucune duplication de logique ; on laisse un tick de rendu avant l'envoi du message pour que le payload recalculé parte bien.

Pour disposer de la liste complète des ouvrages côté suggestion, `ProprieteChatBotMount` expose les ids d'ouvrages dans l'inventaire d'attachements (petit champ additionnel, pas de nouvelle requête).

## 4. Retour utilisateur

Au clic sur une suggestion, un court toast/mention « Contextes activés : 📋 Liste des espèces · 🧪 Prélèvements · 🗺️ Portrait du site » afin de rester fidèle à l'engagement de transparence (rien n'est envoyé en silence). Les contextes restent modifiables/désactivables dans la Console 📎.

## Fichiers touchés

- `src/components/chatbot/ChatSuggestions.tsx` (libellés + ids requis + activation au clic)
- `src/lib/chatSuggestionContexts.ts` (nouveau)
- `src/components/propriete/chatbot/ProprieteChatBotMount.tsx` (expose les ids d'ouvrages)
