

# Audit editorial du tapuscrit v2 — Regard d'editeur de poesie national

## Progres depuis la v1

La couverture est nettement amelioree : titre de l'oeuvre present, mention "Manuscrit inedit", genre indique. Les haikus ont un traitement specifique (spacer vertical, centrage). La police est passee en Times New Roman 12pt. Bon travail.

## Problemes restants identifies

---

### PROBLEMES CRITIQUES

#### 1. Haikus pas isoles sur leur page — texte suivant enchaine sur la meme page
Le haiku ajoute un `PageBreak` AVANT lui mais PAS APRES. Le texte suivant demarre donc immediatement apres le separateur "- - -" du haiku, sur la meme page.

Pages concernees dans le document : 5 (Haiku du soir suivi de "Remonter pour renaitre"), 13, 16, 26, 32, 41.

**Cause** : `createTexteEntry` pour les haikus n'ajoute pas de `PageBreak` apres le contenu.

**Correction** : Ajouter un `PageBreak` apres le dernier paragraphe du haiku (apres ou a la place du separateur "- - -").

#### 2. Separateur "- - -" sur les haikus
Un editeur ne veut pas de separateur decoratif apres un haiku isole sur sa page. Le haiku doit respirer seul. Le saut de page suffit comme separation.

**Correction** : Supprimer le separateur "- - -" pour les haikus et senryus. Le conserver uniquement pour les textes longs (fables, proses, poemes).

#### 3. Pages blanches parasites (pages 15, 28)
La combinaison du `PageBreak` de fin de marche (ligne 1485) + le `PageBreak` en debut de haiku cree deux sauts de page consecutifs = une page vide.

**Correction** : Dans la boucle d'assemblage du document, ne pas ajouter le `PageBreak` de fin de marche si le dernier texte de la marche etait un haiku (qui gere deja son propre saut de page apres).

#### 4. Noms de villes toujours en MAJUSCULES
Les metadata `marche_ville` sont stockees en majuscules dans la base ("BEC D'AMBES - GAURIAC", "LIBOURNE", "SAINT-CAPRAISE-DE-LALINDE", etc.). Elles s'affichent telles quelles dans le document — le code les rend "as-is" sans normalisation.

Pages concernees : 5, 11, 13, 21, 26, 32, 35, 41, 45, 48.

**Correction** : Appliquer une conversion en Title Case sur `marche_ville` avant l'affichage. Creer une fonction `toTitleCase()` qui transforme "BEC D'AMBES - GAURIAC" en "Bec d'Ambes - Gauriac".

---

### PROBLEMES IMPORTANTS

#### 5. Titre de couverture avec tiret long mal gere
Le titre complet "Frequences de la riviere Dordogne — Atlas des vivants" est rendu en un seul bloc en taille 40, ce qui cree une coupure visuelle maladroite avec le "—" isole sur une ligne.

**Correction** : Detecter le separateur " — " dans le titre et le scinder en titre principal + sous-titre. La fonction `createCoverPage` accepte deja un parametre `subtitle` — il suffit de l'utiliser.

#### 6. Taille du texte inconsistante
Les TextRun de contenu utilisent `size: 22` (11pt) alors que le style Normal du document est defini a `size: 24` (12pt). La convention editoriale exige du 12pt uniforme.

**Correction** : Passer les TextRun de contenu de `size: 22` a `size: 24` pour correspondre au style de base du document.

#### 7. Metadata de lieu parfois redondante avec l'en-tete de marche
Certains textes affichent en metadata une ville identique au nom de la marche deja visible dans l'en-tete de section. C'est une repetition inutile.

**Correction** : Comparer `marche_ville` avec le `marche_nom` deja affiche en en-tete. Si identiques ou si `marche_ville` est contenu dans `marche_nom`, ne pas afficher la metadata de lieu.

#### 8. Absence de coordonnees de contact sur la couverture
Un editeur qui veut repondre ne sait pas comment joindre l'auteur. C'est indispensable pour une soumission professionnelle.

**Correction** : Ajouter un champ optionnel `contactEmail` et `contactPhone` dans les options d'export, et les rendre en bas de la page de couverture.

---

## Plan de corrections techniques

### Fichier 1 : `src/utils/wordExportUtils.ts`

#### A. Haiku : isolation complete + suppression separateur

Dans `createTexteEntry`, pour les haikus/senryus :

1. Supprimer le separateur "- - -" (les 10 dernieres lignes de la fonction, conditionnees au type)
2. Ajouter un `PageBreak` APRES le contenu du haiku pour garantir l'isolation

```text
Avant (fin de createTexteEntry pour haiku) :
  [contenu haiku]
  [separateur • • •]

Apres :
  [contenu haiku]
  [PageBreak]
```

#### B. Suppression des pages blanches

Dans la boucle d'assemblage (`exportTextesToWord`, lignes ~1477-1486) :

Ne pas ajouter le `PageBreak` de fin de marche si le dernier texte du groupe etait un haiku ou senryu (car le haiku gere deja son propre `PageBreak` apres).

```typescript
// Apres la boucle des textes d'une marche :
const lastTexte = groupTextes[groupTextes.length - 1];
const lastIsHaiku = lastTexte.type_texte === 'haiku' || lastTexte.type_texte === 'senryu';
if (!lastIsHaiku) {
  children.push(new Paragraph({ children: [new PageBreak()] }));
}
```

#### C. Normalisation des noms de villes (Title Case)

Ajouter une fonction utilitaire :

```typescript
const toTitleCase = (str: string): string => {
  return str.toLowerCase().replace(
    /(?:^|\s|[-'])\S/g,
    (char) => char.toUpperCase()
  );
};
```

L'appliquer dans `createTexteEntry` au moment du rendu de `texte.marche_ville` (ligne 664).

#### D. Gestion du titre avec tiret long

Dans `exportTextesToWord`, avant d'appeler `createCoverPage` :

```typescript
let mainTitle = options.title;
let subtitle: string | undefined;
if (options.title.includes(' — ')) {
  const parts = options.title.split(' — ');
  mainTitle = parts[0];
  subtitle = parts.slice(1).join(' — ');
}
children.push(...createCoverPage(mainTitle, textes.length, subtitle));
```

#### E. Taille de police uniforme a 12pt

Remplacer `size: 22` par `size: 24` dans :
- `createParagraphsFromParsed` (ligne 292)
- `createTexteEntry` pour les haikus (ligne 685)
- Les metadatas de lieu (ligne 664, deja a 20 — passer a 22 pour les metadatas discrètes)

#### F. Eviter la repetition lieu/en-tete

Dans `createTexteEntry`, avant d'afficher la metadata de ville, verifier que `marche_ville` n'est pas deja contenu dans `marche_nom` :

```typescript
if (includeMetadata && !isHaikuOrSenryu && texte.marche_ville) {
  const villeAlreadyInHeader = texte.marche_nom && 
    texte.marche_nom.toLowerCase().includes(texte.marche_ville.toLowerCase());
  if (!villeAlreadyInHeader) {
    // render metadata
  }
}
```

### Fichier 2 : `src/pages/ExportationsAdmin.tsx`

#### G. Ajout du champ contact (optionnel)

Ajouter des champs de saisie `contactEmail` et `contactPhone` dans le panneau d'export Word, transmis dans les options. Valeurs par defaut vides. Rendues sur la couverture uniquement si renseignees.

---

## Recapitulatif des modifications

| Fichier | Modification |
|---------|--------------|
| `src/utils/wordExportUtils.ts` | Haiku : PageBreak apres + suppression separateur. Villes en Title Case. Titre scinde sur " — ". Taille police 12pt. Deduplication ville/marche. Contact sur couverture. |
| `src/pages/ExportationsAdmin.tsx` | Champs optionnels contact email/telephone dans le panneau Word |

## Resultat attendu

Un tapuscrit conforme aux standards des editeurs de poesie nationaux :
- Chaque haiku seul sur sa page, sans separateur, sans metadata, centre
- Aucune page blanche parasite
- Noms de lieux en minuscules avec majuscule initiale
- Titre et sous-titre clairement separes sur la couverture
- Police 12pt uniforme, interligne 1.5
- Coordonnees de contact en bas de couverture
- Pret a envoyer tel quel a Cheyne, Gallimard, Bruno Doucey, Le Castor Astral

