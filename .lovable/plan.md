
# Nouvelle section : "Vivez l'experience -- Exemple d'une Marche"

## Objectif

Inserer une section immersive et narrative qui repond a la question concrete des lecteurs : **"Comment ca se passe, concretement, une Marche du Vivant ?"** Cette section doit donner envie de s'inscrire au calendrier de lancement en rendant l'experience tangible et vivante.

## Emplacement

La section s'insere **entre "Les zones blanches" et le "Calendrier de lancement"**, juste avant le SectionDivider qui precede le calendrier (apres la ligne 352). C'est l'endroit narratif ideal : le lecteur a compris le "pourquoi" et le "comment gamifie", il a maintenant besoin de se projeter dans l'experience reelle avant de voir les dates.

## Structure de la section

### En-tete
- Etiquette : "L'experience sur le terrain"
- Titre : "Plongez dans la Frequence"
- Sous-titre : "L'exemple d'une marche a la confluence Isle / Dordogne"
- Texte d'introduction inspire du contenu fourni, expliquant qu'une Marche du Vivant est une offensive poetique et scientifique.

### Timeline immersive -- 4 etapes

Presentation en timeline verticale (style similaire au calendrier mais plus riche), avec pour chaque etape :
- Un horaire stylise en badge
- Un emoji/icone evocateur
- Un titre accrocheur
- Un texte descriptif inspire du contenu fourni

**Etape 1 -- 09h | L'Accordage**
- Icone : Sparkles (ou Music)
- Accueil, cadre de l'experience, choix du Kigo (mot de saison), croisement poesie et donnees ecologiques locales

**Etape 2 -- 10h | La Marche des Capteurs**
- Icone : Headphones (ou Radio)
- Depart, activation des sens, captation de la Frequence du Vivant, chaque son devient une donnee

**Etape 3 -- 11h | L'Eclosion Geopoetique**
- Icone : PenTool (ou BookOpen)
- Halte creative, carnet en main, poesie contemporaine, pas besoin d'etre ecrivain

**Etape 4 -- Fin de matinee | Le Banquet des Retours**
- Icone : Heart (ou Wine/PartyPopper)
- Partage convivial, celebration du groupe, souvenirs poetiques et comprehension renouvelee

### Design

- Fond avec un leger degrade immersif (plus marque que les autres sections pour creer un "moment" visuel)
- Cards de timeline avec bordure gauche coloree (gradient emerald) pour un effet "journal de bord"
- Chaque etape a un badge horaire avec un style distinctif (rond, fond emerald clair)
- Ornements botaniques discrets
- Animation fadeUp sur chaque etape pour un effet de defilement narratif

### Phrase de transition vers le calendrier

Apres les 4 etapes, une phrase de conclusion motivante en italique serif :
*"Prets a vivre cette experience ? Voici les prochains rendez-vous."*
Avec une fleche visuelle vers le calendrier en dessous.

## Fichier modifie

`src/pages/MarchesDuVivantExplorer.tsx` uniquement :
- Ajout d'imports d'icones supplementaires (Headphones, PenTool, Music ou equivalents disponibles dans lucide-react)
- Insertion de la nouvelle section entre le SectionDivider post-zones-blanches et le SectionDivider pre-calendrier
- Aucun nouveau composant ni fichier supplementaire

## Compatibilite impression

La section suivra les memes regles que le reste : animations ignorees a l'impression, fond blanc force, texte noir.
