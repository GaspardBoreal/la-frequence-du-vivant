# Intention : la carte reste « À compléter » après enregistrement

## Ce qui est établi

La sauvegarde fonctionne : en base, le jardin « Jardin Monde DEVIAT » contient bien la réponse (`answers.profil = "particulier"`, persona `PARTICULIER_PETIT`, mise à jour du 29/08 19:30), et la fonction d'écriture renvoie l'objet de préférences complet. Le problème est donc uniquement côté affichage : l'écran ne reprend pas l'état renvoyé, et il faut recharger la page pour voir la réponse.

Cause probable, non encore confirmée : juste après l'enregistrement, l'écran écrit l'état frais en cache **puis** relance immédiatement une relecture directe de la table des propriétés. Si cette relecture revient vide (droits de lecture différents de ceux de l'écriture, ou réponse plus ancienne), elle écrase l'état frais et la carte retombe sur « À compléter ». Première étape du chantier : le vérifier avant de corriger.

## Étapes

1. **Confirmer le point de rupture** — reproduire l'enregistrement dans le navigateur avec une trace temporaire : contenu renvoyé par l'écriture, contenu du cache juste après, contenu de la relecture. On saura si c'est la relecture qui écrase, ou si l'écran ne se re-rend pas.

2. **Aligner lecture et écriture** — faire lire l'intention par la même voie sécurisée que l'écriture (fonction dédiée côté base, mêmes règles d'accès), au lieu d'une lecture directe de la table. Lecture et écriture ne peuvent alors plus diverger.

3. **Ne jamais écraser un état plus riche** — après enregistrement, l'écran garde l'état renvoyé par la base comme référence et n'accepte une relecture que si elle est cohérente ; la relecture est attendue (et non lancée en parallèle) avant de considérer l'opération terminée.

4. **Retour visuel** — si une relecture échoue, l'afficher au lieu de retomber silencieusement sur « À compléter ».

5. **Vérification** — enchaîner deux réponses de suite (« Qui êtes-vous ? » puis « Où jardinez-vous ? ») : la carte, le compteur « x / 13 » et le bandeau « pas encore passé par le parcours d'accueil » doivent se mettre à jour sans rechargement, et rester justes après F5.

## Détails techniques

- `src/hooks/propriete/usePropertyIntention.ts` : `usePropertyIntention` passe d'un `select` direct sur `proprietes` à une RPC `get_propriete_onboarding` (SECURITY DEFINER, mêmes garde-fous que `can_edit_propriete_onboarding` pour la lecture, ou lecture ouverte aux membres du jardin).
- Migration : création de `public.get_propriete_onboarding(_propriete_id uuid) returns jsonb`, `SECURITY DEFINER`, `set search_path = public`, avec contrôle d'accès explicite ; `grant execute` à `authenticated`.
- `useSaveIntention` / `useSaveGardenExample` : `qc.setQueryData(...)` puis `await qc.refetchQueries({ queryKey: ['propriete-intention', id], exact: true })` ; on conserve les invalidations des autres clés (`propriete-fiche`, `onboarding-garden-example`).
- Garde-fou : dans le `queryFn`, si la réponse est vide alors que le cache contient déjà des réponses, conserver le cache (pas de régression silencieuse) et loguer.
- Aucun changement de schéma de données ; `onboarding_preferences` reste la source unique.
