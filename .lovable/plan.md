# Créer les 12 arrêts : connexion et bouton visible

## Comment vous connecter, tout de suite

L'écran de connexion administrateur est à l'adresse `/admin/login` (par exemple
`https://la-frequence-du-vivant.com/admin/login`). Une fois connecté avec votre compte
administrateur, revenez sur `/sauniers` : la page détecte le droit d'écriture et crée
automatiquement les deux marches et les 12 arrêts, avec la barre de progression.

Aujourd'hui, tant que personne d'administrateur n'ouvre la page, rien n'est créé et la carte
reste vide — c'est ce que vous voyez. Rien n'a été perdu : les 12 arrêts d'origine sont
toujours décrits dans le contenu de la page et seront recréés à l'identique.

## Ce que je propose d'ajouter pour que ce ne soit plus un piège

1. **Un message clair quand la carte est vide.** À la place d'une carte muette, un encart :
   « Le parcours n'est pas encore enregistré » avec, selon le cas, un bouton
   « Se connecter pour créer le parcours » (visiteur) ou « Créer les 12 arrêts » (administrateur).
2. **Création déclenchée par un bouton, plus en silence.** L'administrateur garde la main :
   il voit ce qui va être créé (2 marches, 12 arrêts rattachés à l'événement) et confirme.
   La création reste idempotente : elle ne recrée jamais ce qui existe déjà.
3. **Retour de connexion.** Le bouton de connexion renvoie vers `/admin/login` puis ramène
   sur `/sauniers`, pour ne pas perdre le fil avant la présentation.
4. **Compteur rassurant** une fois créé : « 12 arrêts enregistrés avec Les Secrets de Sauniers ».

## Détail technique

- `src/components/sauniers/ParcoursPlanner.tsx` : nouvel état vide (`points.length === 0`)
  affiché à la place de la carte ; bouton lien `/admin/login?redirect=/sauniers` pour un
  visiteur, bouton d'amorçage pour un administrateur.
- `src/hooks/sauniers/useParcoursSauniers.ts` : l'effet d'auto-amorçage devient un
  déclenchement explicite (`demarrer` exposé) ; `reessayer` est conservé pour les erreurs.
  Aucune modification de la base, des droits ou des tables.
- Vérification de la prise en charge du paramètre `redirect` par `src/pages/AdminLogin.tsx`
  avant de l'utiliser ; sinon simple lien vers `/admin/login`.
