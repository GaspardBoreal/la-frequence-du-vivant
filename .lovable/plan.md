
# Popup "Rejoindre l'aventure" -- Inscription immersive et intergenerationnelle

## Objectif

Transformer le clic sur "Rejoindre l'aventure" en un moment memorable : au lieu de rediriger vers /contact, une popup elegante s'ouvre avec le calendrier des 3 prochaines marches, un texte inspirant et un formulaire d'inscription leger. L'experience doit seduire aussi bien un adolescent curieux qu'un retraite amoureux de la nature.

## Design de la popup

### Structure visuelle
- **Dialog Radix** plein ecran sur mobile, centree sur desktop (max-w-xl)
- Fond avec degrade subtil emerald/teal et ornement botanique en filigrane
- Animation d'entree douce (scale + fade)

### Contenu de la popup (de haut en bas)

**1. En-tete emotionnel**
- Icone Sparkles animee (pulse doux)
- Titre serif : *"Votre premiere Frequence vous attend"*
- Sous-titre : *"Choisissez votre rendez-vous avec le vivant"*

**2. Les 3 dates du calendrier -- Cards cliquables**
Chaque date est une card selectionnable (radio-style) :
- **8-9 mars 2026** -- "Printemps des Poetes" -- Badge "Comite reduit" -- Icone flocon/bourgeon
- **24-25 mai 2026** -- "Fete de la Nature" -- Badge "Comite elargi" -- Icone fleur
- **21 juin 2026** -- "Solstice d'ete" -- Badge "Lancement officiel" -- Icone soleil -- Mise en avant avec bordure doree

Chaque card affiche un petit texte evocateur et l'indication "Gratuit -- Ouvert a tous".

**3. Phrase de reassurance intergenerationnelle**
Texte en italique serif :
*"Aucune condition d'age, de forme physique ou de connaissance prealable. Venez comme vous etes, repartez transformes."*

**4. Formulaire minimaliste**
- Champ prenom (obligatoire)
- Champ email (obligatoire)
- Bouton "Je m'inscris" avec gradient emerald et animation hover
- Mention discrete : "Nous vous enverrons uniquement les informations de la marche choisie."

**5. Pied de popup**
- Lien discret "En savoir plus sur les Marches" vers le haut de la page
- Bouton fermer (X) elegant en haut a droite

### Interactions
- Au clic sur une card de date, elle se selectionne visuellement (bordure emerald, fond leger)
- Au submit, un toast de confirmation s'affiche : "Bienvenue parmi les Marcheurs du Vivant !"
- Le formulaire ne fait pas d'appel backend (pas de Supabase connecte) : il affiche juste le toast de confirmation

## Modification technique

### Fichier modifie
`src/pages/MarchesDuVivantExplorer.tsx` uniquement

### Changements
1. **Imports** : Ajouter `Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription` depuis `@/components/ui/dialog`, plus les icones `Sun, Flower2, Snowflake` de lucide-react
2. **State** : Ajouter `useState` pour `popupOpen` (boolean), `selectedDate` (string | null), `prenom` (string), `email` (string)
3. **Bouton CTA** : Transformer le `<a>` "Rejoindre l'aventure" (ligne 561-571) en `<button>` qui ouvre la popup via `setPopupOpen(true)` au lieu de naviguer vers /contact
4. **Composant Dialog** : Inserer le Dialog juste avant la fermeture du composant, contenant toute la structure decrite ci-dessus
5. **Gestion submit** : Au submit, afficher un toast Sonner de bienvenue et fermer la popup

### Compatibilite impression
La popup n'apparait pas a l'impression (comportement natif du Dialog Radix qui utilise un portal).
