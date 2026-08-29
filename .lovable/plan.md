# Portrait › Intention — deux sous-menus, mobile d'abord

## Constat

L'onglet Intention (`PortraitIntention.tsx`) empile tout en une seule page : phrase de portrait, carte « Le jardin qui vous ressemble », gestes, problème à résoudre, objectif à six mois, profil détecté, puis les 4 chapitres du questionnaire (Vous, Votre lieu, Vos envies, Vos moyens). Sur mobile, le défilement est long et le projet (problème + cap à 6 mois) — pourtant le plus actionnable — se noie au milieu de la description du jardin.

## Ce qui sera fait

### 1. Deux sous-onglets

Un sélecteur interne (pills pleine largeur sur mobile, compteur de renseignements sur chacun) scinde l'écran :

```text
Intention du jardin
[ Le jardin ]   [ Le projet ]        ← sélecteur, sticky sur mobile
```

- **« Le jardin »** — la description : phrase de portrait, carte « Le jardin qui vous ressemble » (exemple choisi/refusé), vos premiers gestes, profil détecté + date de mise à jour, puis les questions des chapitres **Vous / Votre lieu / Vos envies / Vos moyens** (cartes éditables, inchangées).
- **« Le projet »** — ce qui fait travailler : la carte **« Le problème à résoudre »** (texte libre repris mot pour mot, éditable via la question `priorite`) et la carte **« Les six prochains mois »** (objectif, déjà cliquable). Si aucun des deux n'est renseigné, un état vide invitant à poser le cap. Le badge global « n / N renseignés » reste en tête, commun aux deux vues.

Titres proposés : **« Le jardin »** et **« Le projet »** (courts, complémentaires du titre « Intention du jardin » conservé en en-tête). Le bandeau « pas encore passé par le parcours d'accueil » reste visible en haut des deux vues.

### 2. Mobile first

- Sélecteur à deux boutons collés (style segmented), largeur 100 % sous `sm`, `sticky` en haut du volet pour rester accessible au scroll.
- Les grilles `sm:grid-cols-2/3` passent en une seule colonne sur mobile (déjà le cas), avec tailles de texte resserrées (`text-lg` → base mobile).
- Le sous-menu est persisté dans l'URL (`?intention=jardin|projet`) pour retrouver la même vue après édition/rechargement, via le mécanisme `subTab` existant du Portrait.
- Édition : le plein-écran `IntentionQuestionEditor` reste le même ; le problème s'édite en rouvrant la question `priorite` (qui porte le suivi texte libre).

## Détails techniques

- `src/components/propriete/portrait/PortraitIntention.tsx` : ajout d'un état `section: 'jardin' | 'projet'` synchronisé à l'URL, rendu conditionnel des blocs, extraction éventuelle de petits sous-composants internes au fichier.
- Vérifier le branchement du `subTab` dans `TabPortrait.tsx` / `ProprieteEspace.tsx` pour y adosser le nouveau paramètre.
- Aucune migration, aucune donnée touchée, aucune URL publique modifiée.
