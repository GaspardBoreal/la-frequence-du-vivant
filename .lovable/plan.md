

# Audit editorial du tapuscrit - Corrections pour soumission aux editeurs

## Diagnostic : regard d'un editeur de poesie national

Apres analyse complete du document exporte, voici les problemes identifies qui provoqueraient un rejet ou une impression d'amateurisme aupres d'editeurs comme Cheyne, Gallimard Poesie, Bruno Doucey ou Le Castor Astral.

---

## PROBLEMES CRITIQUES (rejet immediat)

### 1. Titre generique "Textes Litteraires - Gaspard Boreal"
La page de couverture affiche un titre technique qui evoque un dossier administratif, pas une oeuvre litteraire. Un editeur veut voir le titre de l'oeuvre : **"Frequences de la riviere Dordogne"** ou un titre d'auteur.

**Cause technique** : La fonction `createCoverPage` dans `wordExportUtils.ts` utilise `options.title` mais celui-ci n'est pas synchronise avec l'exploration selectionnee dans l'export Word standard.

### 2. Pollution de metadonnees sur chaque texte
Chaque haiku et chaque texte affiche :
- Le nom complet de la marche (ex: "La ou elle se jette, je me redresse a Bec d'Ambes")
- Le nom de ville en MAJUSCULES ("BEC D'AMBES - GAURIAC")
- La region en MAJUSCULES ("NOUVELLE-AQUITAINE")

C'est un rendu de base de donnees, pas un manuscrit. Un editeur veut lire de la poesie, pas des fiches techniques.

### 3. Mention "Textes Litteraires" redondante sur la couverture
La couverture affiche trois fois l'auteur/le titre de facon redondante. C'est du bruit visuel.

### 4. "51 textes" sur la couverture
Mention administrative qui n'a pas sa place. Un editeur veut un nombre de pages ou un nombre de signes, pas un decompte de fiches.

---

## PROBLEMES IMPORTANTS (impression non professionnelle)

### 5. Absence de mention "Manuscrit inedit"
Indispensable pour toute premiere soumission. Signale a l'editeur que le texte n'a jamais ete publie.

### 6. Absence de coordonnees de contact
Pas d'email ni de telephone sur la page de titre. Un editeur qui souhaite repondre ne sait pas comment joindre l'auteur.

### 7. Absence de mention de genre
Il manque une indication du type "Poesie / Recit geopoetique" ou "Poesie et prose" pour situer l'oeuvre.

### 8. Pages blanches parasites
Les pages 2, 22, 29 sont vides (pages de transition entre mouvements). Dans un manuscrit, cela ressemble a une erreur d'impression.

### 9. Police Garamond au lieu de Times New Roman
La convention editoriale francaise pour les manuscrits est Times New Roman 12pt, interligne 1.5. Garamond est elegant mais signale un auteur qui "fait sa maquette" au lieu de soumettre un texte brut.

---

## PLAN DE CORRECTIONS

### A. Refonte de la page de couverture (`wordExportUtils.ts` - `createCoverPage`)

Remplacer la couverture actuelle par un format sobre et professionnel :

```text
[haut de page - espace vertical]

GASPARD BOREAL

FREQUENCES DE LA RIVIERE DORDOGNE
Carnet de remontee poetique

Poesie et prose geopoetique

Manuscrit inedit — 51 textes

[bas de page]
contact@email.com
+33 6 XX XX XX XX
Fevrier 2026
```

Modifications :
- Remplacer "Textes Litteraires" par le vrai titre de l'oeuvre (= `options.title` deja passe)
- Ajouter la mention "Manuscrit inedit"
- Ajouter une indication de genre ("Poesie et prose geopoetique")
- Deplacer la date en bas de page
- Supprimer la mention redondante "Textes Litteraires"

### B. Nettoyage des metadonnees texte par texte (`wordExportUtils.ts` - `createTexteEntry`)

Pour un haiku, le rendu actuel est :

```text
Haiku du matin
La ou elle se jette, je me redresse a Bec d'Ambes – BEC D'AMBES - GAURIAC
NOUVELLE-AQUITAINE

Pourquoi descendre
Alors qu'on peut remonter
Le fil de nos vies
```

Le rendu attendu par un editeur :

```text
Haiku du matin

Pourquoi descendre
Alors qu'on peut remonter
Le fil de nos vies
```

Modifications dans `createTexteEntry` :
- **Supprimer l'affichage de `marche_region`** (ligne "NOUVELLE-AQUITAINE") : aucun interet litteraire
- **Supprimer la ville en MAJUSCULES** : le lieu est deja indique dans l'en-tete de marche
- Quand `includeMetadata` est true, reduire a une seule ligne discrete : le nom de la ville en italique, sans la region, sans les CAPS
- Pour les haikus/senryus specifiquement : **aucune metadata** sous le titre (le contexte est donne par l'en-tete de marche)

### C. Nettoyage des en-tetes de marche (`wordExportUtils.ts` - `createSectionHeader`)

L'en-tete actuel affiche le nombre de textes entre parentheses. Meme quand `showCount` est false, le format reste technique.

Modifications :
- S'assurer que le titre de la marche est affiche sans compteur
- La date doit rester en italique sous le titre (c'est un repere de marche, pas une fiche)

### D. Suppression des pages blanches parasites

Les pages vides entre les mouvements sont causees par des doubles sauts de page (un a la fin de la partie precedente + un en debut de couverture de partie).

Modification dans `createPartieCoverPage` :
- Le saut de page initial est suffisant, pas besoin de page blanche intermediaire
- Verifier qu'il n'y a pas de double `PageBreak` consecutifs dans l'assemblage du document

### E. Police et mise en page du document

Modifier la section de configuration du `Document` :
- **Font par defaut** : `Times New Roman` au lieu de `Garamond`
- **Taille** : 24 half-points (= 12pt)
- **Interligne** : 360 (= 1.5 lignes)
- **Marges** : conserver 1 inch (1440 twips) de chaque cote

### F. Synchronisation du titre avec les filtres

S'assurer que quand l'utilisateur selectionne une exploration dans les filtres, le titre de l'export Word standard reprend automatiquement le nom de cette exploration (meme mecanisme que le fix applique au panneau Editeur).

---

## Recapitulatif des fichiers modifies

| Fichier | Modifications |
|---------|--------------|
| `src/utils/wordExportUtils.ts` | Couverture sobre, metadonnees nettoyees, haiku sans metadata, police Times New Roman, suppression pages blanches |
| `src/pages/ExportationsAdmin.tsx` | Synchronisation du titre avec l'exploration pour l'export Word standard |

---

## Resultat attendu

Un tapuscrit conforme aux usages editoriaux francais :
- Page de titre sobre avec titre, auteur, mention "Manuscrit inedit", contact
- Textes lisibles sans pollution de base de donnees
- Haikus isoles, centres, sans metadonnees
- Pages de mouvement (Parties) centrees et elegantes
- Police Times New Roman 12pt, interligne 1.5
- Pret a etre envoye tel quel a Cheyne, Gallimard, Bruno Doucey, Le Castor Astral, Lanskine, Tarabuste, Wildproject ou La rumeur libre

