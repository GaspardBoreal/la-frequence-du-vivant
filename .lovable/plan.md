# Plan — Refonte CTA page Agent IA

## Objectif
Aligner la page `/agent-ia` et la fiche imprimable `/agent-ia/fiche` sur la nouvelle stratégie de conversion (inscription en plus du RDV et du PDF), corriger la navigation retour, et passer en v1.3.

## Modifications

### 1. `src/pages/AgentIA.tsx`
- **Lien « Accueil »** (haut de page) : changer la cible de `/` → `/marches-du-vivant`. Le libellé « Accueil » est conservé.
- **Badge version** : `v1.0` → `v1.3`.
- **Bloc CTA bas de page** : ajouter un 3e bouton **« Créer un compte »** à côté de « Prendre rendez-vous » et « Télécharger la fiche PDF ».
  - Cible : `https://la-frequence-du-vivant.com/marches-du-vivant/connexion` (lien absolu, ouverture même onglet).
  - Style : `variant="hero"` (dégradé) pour le différencier visuellement.
  - Icône : `UserPlus` (lucide-react) pour cohérence sémantique.
- **Nav haut** : pas de bouton inscription supplémentaire en haut (les 2 autres CTA n'y figurent pas non plus, donc règle « partout où apparaissent les 2 autres CTA » respectée).

### 2. `src/pages/AgentIAFiche.tsx` (fiche imprimable / PDF dynamique)
- Passer la mention de version en **v1.3** (si présente).
- Ajouter dans la zone CTA finale le même bouton **« Créer un compte »** pointant vers la même URL absolue, style hero, masqué en `print:hidden` si la zone CTA est déjà masquée à l'impression — sinon visible en aperçu écran et imprimé pour traçabilité du lien.

### 3. Vérifications post-build
- Build OK, pas d'import manquant (`UserPlus` ajouté depuis `lucide-react`).
- Visualiser `/agent-ia` et `/agent-ia/fiche` pour confirmer le rendu des 3 boutons côte à côte (wrap propre en mobile via `flex-wrap` déjà présent).

## Hors scope
- Pas de changement des stats live (déjà unifiées via `usePublicGlobalStats`).
- Pas de modification du SEO/canonical ni du contenu éditorial.
