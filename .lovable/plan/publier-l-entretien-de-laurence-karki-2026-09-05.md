# Publier l'entretien de Laurence Karki

L'entretien existe aujourd'hui comme simple annonce « à paraître ». Il devient une page
complète, sur le même modèle que celle de Gaspard Boréal.

## Ce que voit le visiteur

- Une page à l'adresse `/entretiens/laurence-karki-animer-communaute-vivant`.
- Le portrait de Laurence Karki en haut de page et sur sa vignette dans la liste des
  entretiens (elle passe de la rubrique « Prochains entretiens » aux entretiens publiés).
- La mention « Entretien mené par Victor Boixeda », avec son portrait, comme sur la page
  de Gaspard Boréal.
- Le texte intégral : chapô, les six questions avec sommaire cliquable, et le mot de fin
  (« venez nous rejoindre… ») en clôture.
- Un encadré « À retenir » avec cinq points citables tirés de ses réponses :
  marche + poésie + biodiversité ; le basculement du marcheur quand il s'arrête, observe
  et photographie ; trente ans de ressources humaines au service de l'écoute d'un groupe ;
  le carnet et le haïku écrits au retour de marche ; le chemin vers le rôle d'ambassadrice
  (marches, formation à l'application, validation par les ambassadeurs en place).
- Liens vers l'association, Les Marches du Vivant et l'entretien de Gaspard Boréal.

## Détail technique

- `src/content/entretiens/laurence-karki.md` : texte de l'entretien repris tel quel depuis
  le fichier fourni (titre, chapô, `---`, questions en gras, mot de fin), sans reformulation.
- Portrait : la photo fournie est au format HEIC ; conversion en JPEG puis création du
  pointeur `src/assets/entretiens/laurence-karki.jpg.asset.json` via l'outil d'assets.
- `src/content/entretiens/index.ts` : import du Markdown et du portrait, ajout de
  `portraitUrl` / `portraitAlt` sur la personne `LAURENCE`, remplacement de l'entrée
  provisoire par un `build(...)` avec `interviewer: VICTOR`, `keyPoints`, `entities`,
  `internalLinks`, `related` et `status: 'published'`. Le slug reste inchangé.
- `related` des entretiens de Gaspard Boréal et de Laurent Tripied : Laurence est déjà
  référencée côté Gaspard ; ajout réciproque côté Laurence.
- `public/sitemap.xml` : nouvelle URL, `lastmod` du jour ; `public/llms.txt` : ligne dédiée
  et retrait de Laurence Karki de la liste « à paraître ».
- Aucune nouvelle route : `/entretiens/:slug` existe déjà.

## Vérification

- Page ouverte en navigateur (mobile et bureau) : portrait, crédit interviewer, sommaire
  et ancres des six questions.
- Contrôle que la liste des entretiens affiche bien Laurence dans les publiés.
