

# Fix : Citations vérifiées avec sources traçables

## Problème

Les 30 citations actuelles sont hardcodées sans vérification. Plusieurs sont des fausses attributions, des paraphrases ou des citations apocryphes. Pour un projet éducatif sérieux, chaque citation doit être traçable.

## Solution

1. **Ajouter un champ `source`** (titre du livre/œuvre) et **`url`** (lien vers la référence) à chaque citation
2. **Remplacer les citations douteuses** par des citations vérifiées avec leur œuvre source
3. **Afficher la source** : un petit lien cliquable sous l'auteur permet de vérifier
4. **Réutiliser le composant `SourceTooltip`** existant ou un simple lien discret

## Nouvelle structure de données

```ts
type Citation = {
  texte: string;
  auteur: string;
  oeuvre: string;        // Ex: "Silent Spring (1962)"
  url: string;           // Lien vers la source vérifiable
};
```

## Citations vérifiées (exemples)

| Citation | Auteur | Œuvre source | URL |
|----------|--------|-------------|-----|
| "Dans chaque promenade avec la nature, on reçoit bien plus que ce qu'on cherche." | John Muir | *Unpublished Journals (1938)* | vault.sierraclub.org |
| "Vieil étang — une grenouille plonge, bruit de l'eau." | Bashō | *Furu ike ya (1686)* | wikisource |
| "Le vrai voyage de découverte..." | Marcel Proust | *La Prisonnière (1923)* | gallica.bnf.fr |
| "La nature ne se presse jamais..." | Lao Tseu | *Tao Te King, ch. 73* | sacred-texts.com |
| "Un grand paysage sonore est une composition..." | R. Murray Schafer | *The Soundscape (1977)* | ISBN ref |
| "Le grand orchestre animal..." | Bernie Krause | *The Great Animal Orchestra (2012)* | ISBN ref |

## Citations à supprimer (non vérifiables / apocryphes)

- "Chef Seattle" — texte écrit par Ted Perry en 1971, pas par Chef Seattle
- "Ian Malcolm" — personnage fictif
- Citations paraphrasées sans source exacte (Morizot, Terrasson, Krause paraphrases)

## Affichage dans le widget

```text
┌─────────────────────────────────────┐
│  « Vieil étang — une grenouille     │
│    plonge, bruit de l'eau. »        │
│    — Bashō, Furu ike ya (1686) 🔗   │
│                                     │
│  ▎▍▌▋█▊▉█▋▌▍▎▏▎▍▌▋█▊▉█▋▌▍▎      │
│                                     │
│  Ma Fréquence du jour       ★ 9    │
└─────────────────────────────────────┘
```

Le lien 🔗 est discret (icône ExternalLink en `text-white/30`, 12px) et ouvre la source dans un nouvel onglet.

## Fichier modifié

| Fichier | Changement |
|---------|-----------|
| `src/components/community/FrequenceWave.tsx` | Restructurer le tableau de citations avec `oeuvre` + `url`, remplacer les citations non vérifiées, afficher le lien source |

## Approche de vérification

Je rechercherai chaque citation sur le web pour confirmer son authenticité avant de l'inclure. Les citations conservées seront uniquement celles traçables à une œuvre publiée spécifique.

