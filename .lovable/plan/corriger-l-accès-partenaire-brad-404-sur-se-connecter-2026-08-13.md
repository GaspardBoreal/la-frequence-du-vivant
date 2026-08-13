# Corriger l'accès partenaire BRAD (404 sur « Se connecter »)

## Ce qui se passe réellement

Le processus de création de compte du site n'est pas cassé : la page `/marches-du-vivant/connexion` s'affiche bien et l'onglet **Inscription** fonctionne (vérifié sur la version publiée).

Le bouton **« Se connecter »** de l'encart « Espace partenaire BRAD » (onglets Poste de contrôle / Carte des sondes) pointe vers `/auth`, une route qui n'existe pas dans l'application — d'où la page 404.

Second point vérifié en base : la table des partenaires fournisseurs (`iot_partner_users`) est **vide**. Même en se connectant, aucun compte n'a aujourd'hui le droit d'ouvrir la console BRAD ; seul un administrateur y accède.

## Correction proposée

1. **Lien de connexion correct**
   - Remplacer `/auth` par `/marches-du-vivant/connexion?next=/trust-in-frequence-vivant` dans l'encart partenaire, pour que la personne revienne sur la page BRAD après connexion.
   - Ajouter à côté un second bouton « Créer un compte » pointant vers le même écran en mode inscription.
   - Conserver l'onglet ouvert au retour (mémoriser l'onglet demandé, ex. `?tab=carte`).

2. **Message plus clair**
   - Préciser dans l'encart que l'accès partenaire doit être ouvert par La Fréquence du Vivant : créer un compte ne suffit pas, il faut être rattaché à BRAD Technology.

3. **Ouvrir l'accès à BRAD**
   - Rattacher le compte existant `olivier@brad.ag` à BRAD Technology dans la table des partenaires (une ligne active), afin que les onglets Poste de contrôle et Carte des sondes s'ouvrent réellement.
   - Si d'autres adresses BRAD doivent accéder à la console, elles seront ajoutées de la même façon une fois leurs comptes créés.

## Détails techniques

- `src/pages/TrustInFrequenceVivant.tsx` ligne ~408 : `<Link to="/auth">` → lien vers `/marches-du-vivant/connexion` avec paramètre `next` encodant l'URL courante (onglet inclus).
- Aucune route `/auth` n'est déclarée dans `src/App.tsx` ; on ne crée pas de redirection fantôme, on corrige le lien à la source. Une vérification globale confirme que ce lien est la seule occurrence de `/auth`.
- Insertion d'une ligne dans `public.iot_partner_users` (`user_id` de `olivier@brad.ag`, `fournisseur_id` de BRAD, `actif = true`) via migration : c'est ce que lisent `useIotPartnerAccess` et les policies RLS de scoping fournisseur.
- Aucun changement d'URL publique, mot de passe et `noindex` conservés.

## Vérification

- Depuis une session déconnectée : cliquer « Se connecter » depuis l'encart partenaire ouvre l'écran de connexion (plus de 404) et renvoie sur `/trust-in-frequence-vivant`.
- Connecté avec le compte BRAD : les onglets Poste de contrôle et Carte des sondes affichent uniquement les trois sondes BRAD.
