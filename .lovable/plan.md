# Corriger l’IA de Jardin masquée par la fiche capteur

## Diagnostic confirmé

La première correction ferme bien la **visionneuse photo**, mais elle laisse ouverte la **fiche capteur** qui la contient.

- Le clic incrémente `closeSignal`, donc `SensorPhotoGallery` retire la photo plein écran.
- Ensuite `openIotAi()` ouvre le chatbot en mode étendu.
- Mais, contrairement à « Voir tous les graphes », le gestionnaire IA de l’accueil ne ferme jamais `SensorPeekDialog`.
- La fiche Radix et le chatbot utilisent tous deux le niveau `z-index: 1200`. Le portail de la fiche reste donc au-dessus du chatbot : la copie 2 montre bien la fiche revenue à sa vignette, mais toujours ouverte devant l’IA.

Le problème n’est donc plus l’image elle-même : c’est le **dialogue capteur résiduel** et l’égalité de leurs niveaux de superposition.

## Correction

1. À l’ouverture de l’IA depuis la fiche de l’accueil, fermer explicitement `SensorPeekDialog`, comme c’est déjà fait pour l’Observatoire.
2. Déclencher `openIotAi()` juste après la fermeture du dialogue afin que son portail et son piège de focus soient démontés avant que le chatbot prenne le premier plan.
3. Ne pas augmenter arbitrairement tous les `z-index` du chatbot : cela masquerait ce défaut de cycle de vie et pourrait le faire passer devant d’autres surfaces prioritaires.
4. Conserver la fermeture de la visionneuse photo comme sécurité locale ; elle reste utile dans les autres fiches capteur qui ne sont pas des dialogues.

## Vérification

Rejouer exactement le parcours signalé :

```text
Accueil partenaire → Potager d’Été → photo en grand
→ Interroger l’IA de Jardin
```

Résultat attendu : la photo et la fiche capteur disparaissent, puis l’IA de Jardin s’affiche seule au premier plan, avec la sonde Potager d’Été comme contexte et la question préremplie. Vérifier aussi que « Voir tous les graphes » et l’ouverture IA depuis la carte restent inchangés.