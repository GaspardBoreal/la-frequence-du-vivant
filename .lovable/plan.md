## Correctif bandeau haut · Étape 2 « J'analyse le sol »

Le composant `StepHeader` (`src/components/propriete/observe/StepHeader.tsx`) affiche en dur « J'observe le site » et son sous-titre, quelle que soit l'étape. Résultat : dans `TabAnalyze`, on lit encore « J'observe le site » alors que l'on est à l'étape 2.

### Changements

**1. Rendre `StepHeader` paramétrable (rétro-compatible)**
- Ajouter deux props optionnelles : `title?: string`, `subtitle?: React.ReactNode`.
- Défauts inchangés (`"J'observe le site"` + sous-titre actuel) → aucune régression sur `TabObserve`.

**2. `TabAnalyze` — nouveau bandeau inspiré de la page 6 du guide D.S.**
Passer à `StepHeader` :
- **Titre** : `J'analyse le sol`
- **Sous-titre** (registre sensoriel + méthode, court et rythmé) :
  > *Lire la terre par les mains et les yeux : texture, structure, pH, signes de vie.*  
  > **Toucher · Sentir · Comprendre.**

Le triptyque final (`Observer · Comprendre · Concevoir` → `Toucher · Sentir · Comprendre`) fait écho au triptyque de l'étape 1 tout en signalant le passage de l'œil (observation) au tact (analyse du sol), fidèle à la méthode D.S. (test du boudin, motte cassée à la main, odorat).

### Fichiers touchés
- `src/components/propriete/observe/StepHeader.tsx` — props `title` / `subtitle` optionnelles.
- `src/components/propriete/tabs/TabAnalyze.tsx` — passer les nouveaux libellés.

Aucun impact data, aucun autre écran modifié.
