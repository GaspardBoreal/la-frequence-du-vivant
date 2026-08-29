# OFJ : créer le jardin et l'ouvrir dans LFDV après confirmation d'e-mail

## Ce que montre la base (vérifié)

- Le dernier compte OFJ (`aurelien.dript@gmail.com`, confirmé le 29/08 à 16:31) a bien `raw_user_meta_data.app = 'frequence-jardin'` et `garden_name = "Jardin structuré · 64220 · KOL5"`, **1 profil marcheur** créé… mais **0 jardin**.
- La RPC `onboard_create_propriete` exige une session (`auth.uid()`) et un profil marcheur ; elle pose déjà `main_walker_id` = marcheur référent, donc l'affichage dans `/admin/proprietes` suivra automatiquement.
- Conclusion : le compte et le profil sont créés, mais **le versement du jardin n'a jamais lieu**. Les réponses d'onboarding vivent uniquement dans le navigateur OFJ ; au retour du lien de confirmation, l'utilisateur atterrit sur l'accueil FJ (aucune route de reprise) et le brouillon est perdu — a fortiori si l'e-mail est ouvert sur un autre appareil.

Corollaire : tant que le brouillon reste côté navigateur, le problème se reproduira. Il faut le transporter avec le compte.

## Principe de la solution

Faire voyager les réponses d'onboarding **dans les métadonnées du compte** (là où `app` et `garden_name` voyagent déjà), et faire atterrir le lien de confirmation **sur LFDV**, qui matérialise le jardin puis ouvre sa fiche.

```text
OFJ  signUp(metadata: app, garden_name, onboarding)   emailRedirectTo -> LFDV
                     |
             e-mail FJ (branding inchangé)
                     |
   clic -> LFDV /jardin/bienvenue  (session établie)
                     |
        RPC claim : profil + jardin (idempotent)
                     |
            redirection /propriete/<slug>
```

## Étape 1 — LFDV : RPC de matérialisation

Nouvelle RPC `onboard_claim_from_metadata()` (SECURITY DEFINER, `authenticated`) :
- lit les réponses dans `auth.jwt() -> 'user_metadata' -> 'onboarding'` (jamais dans un paramètre client, donc non falsifiable) ;
- crée le profil marcheur s'il manque (réutilise `create_community_profile`, déjà idempotent) ;
- **idempotence** : si un jardin existe déjà avec `created_by = auth.uid()` et le même nom, on renvoie son `slug` sans rien créer (double clic sur le lien, réouverture de l'e-mail) ;
- sinon insère via la même logique que `onboard_create_propriete` (nom, ville, code postal, lat/lng, `onboarding_preferences`, `main_walker_id`) ;
- renvoie `{ id, slug, created }` ; si aucune donnée d'onboarding n'est présente, renvoie `{ empty: true }`.

## Étape 2 — LFDV : page d'atterrissage `/jardin/bienvenue`

- Consomme le hash de session (même mécanique que `AuthHashHandler`), attend la session.
- Appelle la RPC, affiche un court écran « Nous préparons votre jardin… » aux couleurs Fréquence Jardin, puis redirige vers `/propriete/<slug>`.
- Cas d'erreur : message clair + bouton vers `/jardin/demarrer` (parcours de création manuelle existant) ; cas `empty` : même repli.
- Ajouter la route dans `App.tsx`.

## Étape 3 — LFDV : conserver le branding FJ

Le hook `auth-email-hook` choisit la marque d'après l'hôte de `redirect_to`. Comme la redirection pointera désormais vers LFDV, on étend `brand.ts` : le marqueur `auth_brand=fj` présent dans `redirect_to` suffit à forcer la marque FJ, quel que soit l'hôte (la valeur reste validée par la liste blanche Supabase). Les tests de `brand_test.ts` sont complétés en conséquence. Aucune modification des gabarits LFDV.

## Étape 4 — Configuration Supabase (action utilisateur)

Dans Authentication → URL Configuration → Redirect URLs, ajouter :
- `https://la-frequence-du-vivant.com/jardin/**`
- `https://www.la-frequence-du-vivant.com/jardin/**`
- `https://la-frequence-du-vivant.lovable.app/jardin/**`

## Étape 5 — Prompt à exécuter dans le projet OFJ

Je fournirai le texte exact à coller. En résumé, à l'inscription :
- ajouter `onboarding` (le payload complet déjà destiné à `onboarding_preferences` : `answers`, `flow_version`, `persona`, `portrait`, `gestures`, `garden_example`) **et** `nom`/`ville`/`code_postal`/`latitude`/`longitude` dans `options.data`, à côté de `app` et `garden_name` ;
- `emailRedirectTo = https://la-frequence-du-vivant.com/jardin/bienvenue?auth_brand=fj` ;
- ne plus tenter de créer le jardin côté OFJ après confirmation (sinon doublon) ; le parcours « session déjà active » peut continuer d'appeler directement `onboard_create_propriete`.

## Étape 6 — Recette

1. Parcours OFJ complet avec une adresse neuve → e-mail au branding Fréquence Jardin.
2. Clic depuis un **autre appareil** → atterrissage LFDV → fiche `/propriete/<slug>` ouverte, réponses visibles dans Portrait › Intention.
3. `/admin/proprietes` : le jardin apparaît avec le compte en marcheur référent.
4. Reclic sur le même lien → aucune création en double.
5. Non-régression LFDV : inscription et mot de passe oublié LFDV strictement inchangés.

## Détails techniques

- Fichiers LFDV touchés : une migration SQL (nouvelle RPC), une nouvelle page + sa route, `supabase/functions/auth-email-hook/brand.ts` (+ tests) et redéploiement du hook.
- Aucun changement de schéma de table, aucun nouveau secret, aucune table de brouillons : le payload voyage dans les métadonnées du compte (quelques kilo-octets, limite honorée).
- Les comptes OFJ déjà confirmés sans jardin (dont celui d'Aurélien) pourront créer leur jardin via `/jardin/demarrer`, ou seront repris automatiquement s'ils possèdent les métadonnées au moment de leur prochaine connexion.
