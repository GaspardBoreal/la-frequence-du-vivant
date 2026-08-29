# Le Portrait d'intention : consulter, modifier et compléter l'onboarding

## Constat vérifié

La propriété « Terrasse nourricière Toulousaine » (Toulouse, 31300, créée le 28 août par l'onboarding) existe bien, avec sa géolocalisation et sa surface (10 m²). Mais sa colonne `onboarding_preferences` est **vide** (`{}`) : les réponses du questionnaire n'ont pas été écrites en base par le projet dérivé.

Conséquence : aujourd'hui, aucune donnée d'onboarding n'est consultable — non pas parce que l'écran manque, mais parce que la donnée n'arrive pas. C'est le point de départ obligatoire.

## Ce que je propose

Un seul et même endroit sert les deux cas (propriété née de l'onboarding, propriété créée autrement) : un sous-onglet **« Intention »** dans **Mon projet › Portrait**, à côté de Galerie et Cadastre, modifiable afin de permettre d'actualiser / modifier l'ensemble des critères de l'onbording.

```text
Mon projet ▾
 ├─ Portrait  ·  Galerie | Cadastre | Intention   ← ici
 ├─ Je synthétise
 ├─ Palette végétale
 └─ …
```

Pourquoi là et pas ailleurs :

- Le Portrait est déjà « qui est ce jardin » (identité, photos, parcelles). L'intention du jardinier appartient à la même famille : c'est le portrait de l'envie, pas une mesure de terrain.
- « J'observe / J'analyse / J'identifie » sont des vues de constat, alimentées par le vivant et les sondes. Y glisser un questionnaire casserait la lecture.
- « Je synthétise » consomme l'intention pour produire un verdict ; il ne doit pas être aussi l'endroit où on la saisit.

### Écran Intention — deux états, même page

- **Jardin renseigné** : lecture en cartes calmes, une par chapitre (Vous, Votre lieu, Vos envies, Vos moyens), avec la persona déduite affichée en tête et un crayon par carte qui rouvre l'écran de question correspondant, en plein écran, dans le style de l'onboarding. Modification unitaire, jamais de reprise du parcours entier.
- **Jardin sans intention** (créé à la main, importé, admin) : un bandeau invitant « Complétez le portrait de votre jardin — 2 minutes » qui lance le même moteur de questionnaire, pré-rempli avec ce que la propriété sait déjà (ville, surface, présence de sondes, espèces observées) pour ne poser que le manquant. Toujours interruptible, toujours reprenable : les cartes non répondues restent visibles en creux.

### Le nouvel écran « objectif à six mois »

C'est la question la plus actionnable du lot : elle ne décrit pas le jardin, elle déclenche le travail. Elle mérite un traitement à part.

- Posée en fin de parcours, juste avant le bilan, et **re-posée** depuis la carte Intention (« Votre objectif — révisé le … / Définir un nouvel objectif »), car un objectif à six mois est par nature périssable.
- Stockée avec sa date de définition et son horizon, afin que « Je synthétise », l'IA de Jardin et la Palette végétale puissent y référer et que l'échéance puisse être relancée plus tard.

## Ordre de travail recommandé

1. **Rétablir le flux de données** : vérifier pourquoi le projet dérivé n'écrit pas dans `onboarding_preferences`, corriger, et retrouver les réponses de la Terrasse toulousaine si elles existent encore côté client. Sans cela, tout écran de consultation reste vide.
2. **Sous-onglet Intention en lecture** : afficher ce qui est saisi, avec la persona. Livrable court, valeur immédiate.
3. **Édition unitaire** : crayon par chapitre, réutilisant les écrans de question existants.
4. **Complétion pour les propriétés sans onboarding** : bandeau d'invitation + parcours pré-rempli.
5. **Objectif à six mois** : question dans le parcours, carte dédiée dans Intention, exposition aux modules qui la consomment.

Étapes 1 à 3 dans un premier temps : elles rendent visible ce qui est déjà collecté. Les étapes 4 et 5 suivent immédiatement, l'objectif à six mois arrivant en dernier parce qu'il s'appuie sur le socle d'édition posé en 3.

## Détail technique

- Base : rien à créer. Tout tient dans `proprietes.onboarding_preferences` (`jsonb`), enrichie d'un bloc `objectif_6_mois` (`{ texte, choix, defini_le, horizon }`) et d'un bloc `meta` (`{ version_sequence, source: 'onboarding' | 'complete_apres_coup', complete_le }`).
- Front : nouveau `PortraitIntention.tsx` sous `src/components/propriete/portrait/`, branché comme troisième `SubTab` dans `TabPortrait.tsx` (le mécanisme `subTab` contrôlé existe déjà et est piloté depuis `ProprieteEspace.tsx`).
- Le moteur de questionnaire (`src/config/onboarding/schema.ts`, `personas.ts`, `resolveQuestion`, `buildSequence`) est réutilisé tel quel en mode « une question isolée » — pas de duplication de logique.
- Hook `usePropertyIntention` : lecture, écriture partielle par clé, recalcul de la persona à chaque modification via `detectPersona`.
- Écriture protégée sur le même principe que le registre de sol : pas d'autosave sans saisie réelle, jamais d'écrasement par un état vide.
- Aucune URL publique touchée ; aucune migration nécessaire hormis, éventuellement, un index si la lecture croisée devient fréquente.