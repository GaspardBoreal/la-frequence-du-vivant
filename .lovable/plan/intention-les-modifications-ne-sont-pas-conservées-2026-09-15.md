# Intention : les modifications ne sont pas conservées

## Ce qui est vérifié

- Le jardin affiché (`/propriete/jardin-structure-64420-uaja` = « Les Hortensias ») contient bien des réponses en base, mais **la dernière écriture de ses préférences date du 14/09 à 21:35 (heure de Paris)**, et elle correspond à la rédaction automatique des « premiers gestes », pas à une réponse enregistrée depuis. Autrement dit : les modifications faites aujourd'hui **ne sont jamais arrivées en base**.
- Ce n'est pas un problème de droits d'accès techniques : la fonction d'enregistrement est bien ouverte aux personnes connectées, et elle fusionne correctement (elle ne peut pas effacer les réponses existantes).
- Ce n'est pas un problème de cache mémorisé au rechargement : l'application ne conserve rien entre deux ouvertures de page, elle relit toujours la base.

Conclusion : l'enregistrement échoue (ou n'est jamais déclenché) côté écran, et l'écran ne le dit pas assez clairement — la fenêtre se ferme, on croit avoir enregistré.

La cause exacte de l'échec n'est pas encore confirmée. Trois candidats plausibles, à départager :
1. la session a expiré : la lecture fonctionne encore depuis le cache d'écran, mais l'écriture est refusée ;
2. le bouton « Enregistrer » est bloqué sans le dire pour les questions à précision obligatoire (ex. « Résoudre un problème » sans la phrase explicative) ;
3. l'enregistrement part bien mais la réponse d'erreur est avalée.

## Étapes

1. **Confirmer le point de rupture** — reproduire une modification dans le navigateur en observant l'appel d'enregistrement : est-il émis, que répond la base. Cette étape décide de la suite ; rien n'est corrigé avant.

2. **Ne jamais fermer la fenêtre sans preuve d'enregistrement** — la fenêtre d'édition ne se referme que lorsque la base a confirmé l'écriture. En cas de refus, elle reste ouverte, la saisie est conservée et le motif réel s'affiche en clair (« session expirée, reconnectez-vous », « accès refusé à ce jardin », etc.).

3. **Rendre visible ce qui bloque le bouton** — si une précision obligatoire manque, le bouton explique pourquoi au lieu de rester grisé sans raison apparente.

4. **Relire après écriture, et le dire** — après enregistrement, l'écran affiche l'état renvoyé par la base puis attend la relecture ; si la relecture échoue, un bandeau le signale au lieu de laisser une valeur périmée.

5. **Vérification** — enchaîner trois modifications de nature différente (un choix simple, la surface, la priorité avec sa phrase), fermer l'onglet Intention, y revenir, puis recharger la page : les trois valeurs doivent être identiques à ce qui a été saisi, et une date de mise à jour du jour doit apparaître en base.

## Détails techniques

- `src/components/propriete/portrait/PortraitIntention.tsx` : `handleSave` passe en `mutateAsync` ; `setEditing(null)` uniquement dans le `onSuccess`, jamais avant ; `onError` affiche le message traduit et laisse le panneau ouvert.
- `src/hooks/propriete/usePropertyIntention.ts` : ajout d'un traducteur d'erreurs (`42501` → « Session expirée ou accès refusé… », `P0002` → « Jardin introuvable ») sur `callSaveOnboarding`, et contrôle préalable de session (`supabase.auth.getUser()`) avant l'appel, pour distinguer un refus de droits d'une session perdue.
- `IntentionQuestionEditor` : le bouton « Enregistrer » reste actif ; la validation de la précision obligatoire déclenche un message explicite au clic plutôt qu'un `disabled` muet.
- Journalisation temporaire (retirée après diagnostic) du patch envoyé et de la réponse, pour l'étape 1.
- Aucune migration, aucun changement de schéma, aucune URL touchée.
