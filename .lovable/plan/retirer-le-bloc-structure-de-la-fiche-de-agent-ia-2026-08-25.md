# Retirer le bloc « Structure de la fiche » de /agent-ia

Non, ce n'est pas normal. Ce bloc est un reste de gabarit : il décrit le **modèle de fiche**
(« 6 sections standardisées — modèle bziiit × PiloTerra ») au lieu de parler de l'agent.
Pour un visiteur, et surtout pour un LLM qui cite la page, c'est du bruit : il énumère des
méta-libellés (« Identité & Statut », « Mission », « Capacités clés »…) qui ne contiennent
aucun fait sur Les Marches du Vivant, juste après les sections qui, elles, donnent la vraie
information. Cela dilue la densité factuelle de la page, juste avant le CTA.

## Correction

Supprimer la section « Structure rappel » (le titre, la ligne italique et la grille de 6 cartes)
ainsi que le tableau `sections` qui ne sert qu'à elle. Rien d'autre ne change : le flux passe
directement de « Déploiement en 3 étapes » au CTA final, ce qui resserre la fin de page.

Aucun impact sur le SEO/GEO existant : ni le `<title>`, ni la meta description, ni le JSON-LD,
ni le bloc « En bref », ni les entretiens ne référencent ce contenu.

## Détails techniques

- `src/pages/AgentIA.tsx` : retirer la section commentée `{/* Structure rappel */}` (lignes ~531-546)
  et la constante `sections` (ligne ~37).
- Vérifier qu'aucune icône ou import ne devient inutilisé après suppression.

## Vérification

Rendu de `/agent-ia` en 375 px et 1280 px, thèmes clair et sombre : enchaînement
Déploiement → CTA fluide, aucun espace vide résiduel.
