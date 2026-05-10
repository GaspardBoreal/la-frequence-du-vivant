## Objectif

Supprimer définitivement le toggle de langue **EN | FR** et le badge de qualité de traduction (« Traduction medium - local », 🇫🇷, 📡, AI). Affichage 100 % FR partout, sans contrôle utilisateur.

## Étapes

### 1. `src/components/biodiversity/SpeciesDetailModal.tsx`
Retirer le composant `LanguageToggleCompact` du header de la modal (le bouton EN | FR visible en haut à droite sur la capture).

### 2. `src/components/biodiversity/SpeciesDisplay.tsx`
- Retirer le rendu du badge de qualité de traduction (`Badge` avec emoji 🇫🇷/📡/AI).
- Retirer le `LanguageToggleCompact` et la prop `showLanguageToggle`.
- Nettoyer les imports devenus inutiles (`Badge`, `LanguageToggleCompact`).

### 3. Vérification globale
`rg "LanguageToggle|showLanguageToggle"` → s'assurer qu'aucun autre composant ne l'expose. Si d'autres usages apparaissent (header global, autre modal), les retirer également.

### 4. Nettoyage optionnel
Si plus aucun import de `LanguageToggleCompact` / `LanguageToggle` ne subsiste, supprimer le fichier `src/components/ui/language-toggle.tsx` et le `LanguageContext` n'est plus utilisé pour les espèces (à laisser si utilisé ailleurs — vérifier d'abord).

## Hors scope

- Pas de changement du résolveur FR (`useFrenchSpeciesNamesAuto`) ni de la base.
- Pas de modification du contenu des données.
