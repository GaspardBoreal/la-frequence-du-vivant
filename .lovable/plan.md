# Prompt à copier-coller dans le projet « Onboarding Fréquence Jardin »

Le projet central (LFDV) est prêt : il relit et affiche tout le payload OFJ (réponses, persona, portrait, gestes, image retenue et ses métadonnées) dans `Mon projet › Portrait › Intention`, et la RPC `onboard_create_propriete` accepte les préférences en 6e paramètre. Deux chantiers restent côté OFJ, plus une vérification.

## Ce que le prompt doit faire faire au projet dérivé

1. **Passer en `flow_version: 4`** : poser la question `objectif_6_mois` (« Quel objectif aimeriez-vous atteindre dans les six prochains mois pour votre jardin ? ») en fin de parcours, juste avant le bilan, et verser la réponse dans `onboarding_preferences.answers.objectif_6_mois`. La clé est déjà connue côté LFDV (`DEFAULT_QUESTIONS` séquence v4, mise en avant dans l'onglet Intention).
2. **Tracer le refus de galerie** : quand l'utilisateur choisit « Aucun ne me ressemble » à l'écran « Lequel vous ressemble le plus ? », verser `garden_example: { refused: true, refusedAt }` au lieu de `null` — LFDV saura ainsi distinguer « pas encore répondu » de « refus assumé ».
3. **Ne rien écraser** : rappeler que `onboarding_preferences` est versé en une seule fois à la création et jamais réécrit ensuite (LFDV le fusionne désormais par patch via `save_propriete_onboarding`).

## Le prompt à copier-coller

---

Dans ce projet « Onboarding Fréquence Jardin », effectue trois mises à jour du versement final (création du jardin via la RPC `onboard_create_propriete`). Ne touche ni aux tables, ni aux Edge Functions, ni aux RPC : tout est déjà prêt côté projet central.

### 1. Question « objectif à six mois » (flow_version 4)

- Ajoute une question en fin de parcours, juste avant l'écran de bilan : « Quel objectif aimeriez-vous atteindre dans les six prochains mois pour votre jardin ? »
- Format : réponse libre courte (champ texte, 2 lignes max) OU, si le parcours préfère les cartes, 4 choix (« Récolter mes premiers légumes », « Embellir mon espace », « Faire revenir le vivant », « Structurer mon projet ») avec option « autre » en texte libre. Choisis le format le plus cohérent avec les écrans existants.
- Verse la réponse dans `onboarding_preferences.answers.objectif_6_mois` (string).
- Mets à jour le champ `flow_version` versé à `4`.

### 2. Refus de galerie explicite

À l'écran « Lequel vous ressemble le plus ? », quand l'utilisateur valide « Aucun ne me ressemble », verse :

```json
"garden_example": { "refused": true, "refusedAt": "<ISO date>" }
```

au lieu de `null`. Le cas « image choisie » reste inchangé (id, stableId, titre, sousTitre, intention, keywords, aiProfile, vignette, chosenAt).

### 3. Garde-fou d'écriture

- `onboarding_preferences` est versé en une seule fois, à la création du jardin, via le 6e paramètre `_preferences` de `onboard_create_propriete`.
- Ne réécris jamais cette colonne ensuite : côté projet central, les jardiniers modifient leurs réponses question par question (fusion par patch). Un second versement complet écraserait leurs modifications.
- Conserve `storedPersona` tel quel dans le payload : il ne doit jamais être recalculé côté central.

### Vérification

Après un parcours complet de test, vérifie en base que la propriété créée contient bien : `answers.objectif_6_mois`, `flow_version: 4`, et — selon le choix — soit `garden_example.id`, soit `garden_example.refused: true`.

---

## Pourquoi cet ordre

La question 1 est la plus visible pour les utilisateurs (remontée utilisateurs) ; la 2 conditionne l'affichage correct de la carte « Le jardin qui vous ressemble » dans LFDV ; la 3 est un rappel de sécurité des données, sans développement si le comportement est déjà bon.
