# Fix : DropdownMenu du trombone invisible derrière le chatbot

## Cause

Le passage du panneau chatbot à `z-[1200]` a placé le `DropdownMenuContent` (Radix Portal, z-50 par défaut) **sous** le panneau. Résultat : clic sur le trombone → menu rendu mais invisible/non cliquable. Les deux fonctionnalités (upload document + attach liste d'espèces) sont donc cassées sur toutes les vues où le pool d'espèces est disponible.

## Correction (1 fichier)

Dans `src/components/chatbot/ChatBot.tsx` ligne 663, ajouter une classe z-index au `DropdownMenuContent` pour qu'il passe au-dessus du panneau chatbot (`z-[1200]`) tout en restant sous les toasts :

```tsx
<DropdownMenuContent align="start" className="w-64 z-[1250]">
```

## Vérification

1. Ouvrir le chatbot sur la vue Carte exploration (speciesPool disponible).
2. Cliquer le trombone → menu déroulant visible avec les 2 options.
3. Cliquer « Un document » → sélecteur de fichier natif s'ouvre.
4. Cliquer « 🌿 Liste des espèces » → badge attaché en haut de la zone input.
5. Vérifier sur une vue sans pool (ex. fiche profil) : le trombone reste un bouton direct → sélecteur natif OK.

## Hors-scope

- Pas de modification des z-index du chatbot (le fix précédent reste valide).
- Pas de refactor du système Portal Radix.
