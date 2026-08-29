---
name: OFJ → LFDV : création du jardin après confirmation d'e-mail
description: Le lien de confirmation Fréquence Jardin atterrit sur LFDV /jardin/bienvenue, qui matérialise le jardin depuis les métadonnées du compte via onboard_claim_from_metadata
type: feature
---

Parcours : OFJ `signUp` avec `options.data = { app: 'frequence-jardin', garden_name, onboarding: { nom, ville, code_postal, latitude, longitude, preferences } }` et `emailRedirectTo = https://la-frequence-du-vivant.com/jardin/bienvenue?auth_brand=fj`.

- **RPC `onboard_claim_from_metadata()`** (SECURITY DEFINER, `authenticated`) : lit `auth.users.raw_user_meta_data` (jamais un paramètre client), exige `app = 'frequence-jardin'`, crée le profil marcheur si absent, insère la propriété avec `main_walker_id` (marcheur référent) et `onboarding_preferences`. **Idempotente** : même `created_by` + nom + code postal → renvoie le slug existant, `created: false`.
- **Page `/jardin/bienvenue`** (`src/pages/JardinBienvenue.tsx`) : attend la session issue du hash, appelle la RPC, redirige vers `/propriete/<slug>` ; repli `/jardin/demarrer` si aucune donnée d'accueil.
- **`AuthHashHandler`** ne détourne plus les liens `type=signup` arrivant sous `/jardin/`.
- **Branding** : `brand.ts` accepte désormais le marqueur `auth_brand=fj` **quel que soit l'hôte** de `redirect_to` (validé par la liste blanche Supabase), pour garder les gabarits FJ même quand l'atterrissage se fait sur LFDV.
- Prérequis Supabase : `https://la-frequence-du-vivant.com/jardin/**` (+ www, + .lovable.app) dans Redirect URLs.
