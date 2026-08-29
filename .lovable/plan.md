# Réponse au contrôle OFJ — état de la chaîne d'accueil

## Résultat du contrôle (lecture seule, rien modifié)

**1. URLs de redirection / Site URL** — Non vérifiable par mes outils : la configuration Auth (Site URL, Redirect URLs) n'est lisible que dans le tableau de bord Supabase. À contrôler manuellement (Authentication → URL Configuration) ; doivent y figurer :
`https://la-frequence-du-vivant.com/jardin/**`, `https://www.la-frequence-du-vivant.com/jardin/**`, `https://la-frequence-du-vivant.lovable.app/jardin/**`, `https://frequence-jardin.lovable.app/**`, et l'aperçu OFJ `https://id-preview--*.lovable.app/**`. Les motifs `/**` couvrent la query string `?auth_brand=fj`.

**2. Route `/jardin/bienvenue`** — Existe (`src/App.tsx:394`, page `src/pages/JardinBienvenue.tsx`). Elle laisse le SDK consommer le hash de session, attend via `onAuthStateChange`, appelle la RPC une seule fois (garde `hasRun`), puis redirige vers `/propriete/<slug>`. Si aucune session n'arrive en 8 s : écran d'erreur avec « Créer mon jardin » (`/jardin/demarrer`) et « Me connecter ».

**3. Matérialisation** — RPC `onboard_claim_from_metadata()` (migration `20260829164534`), SECURITY DEFINER, `EXECUTE` réservé à `authenticated`. Elle relit `auth.users.raw_user_meta_data` (jamais un paramètre client), exige `app = 'frequence-jardin'`, crée le profil marcheur si absent, insère la propriété. Idempotente : même `created_by` + même nom + même code postal → renvoie le slug existant, `created:false`. Sans `onboarding` (inscription native LFDV) : retour `{empty:true, reason:'not_fj'}` ou `no_garden_name`, aucune création.

**4. Préférences** — Écrites une seule fois, en totalité, à l'insertion (`onboarding_preferences`). Ensuite, seule `save_propriete_onboarding` intervient, en fusion superficielle (`||`), donc jamais d'écrasement global. Colonne JSONB libre : `garden_example: {refused, refusedAt}` et `answers.priorite_probleme` (texte libre) sont conservés tels quels, sans dictionnaire de libellés.

**5. Charge tronquée** — La création reste valide : seuls `nom` (2–120 caractères) est requis ; `ville`, `code_postal`, `latitude`, `longitude` sont facultatifs, les coordonnées hors bornes sont neutralisées. `preferences.truncated = true` est simplement stocké. Garde-fou : au-delà de ~100 Ko de préférences, la RPC refuse.

**6. E-mails** — `auth-email-hook` résout la marque dans l'ordre : métadonnée `app = frequence-jardin` → marqueur `auth_brand=fj` dans `redirect_to` → domaine FJ → LFDV. Le lien conserve toujours le `redirect_to` demandé (`/auth/v1/verify?...&redirect_to=<valeur du payload>`) ; le repli sur le Site URL ne concerne que le lien d'en-tête décoratif de l'e-mail. À noter : si Supabase rejette l'URL (non whitelistée), il la remplace avant le hook — d'où l'importance du point 1.

**7. Droits** — Le trigger `trg_sync_propriete_main_walker_access` crée l'accès marcheur à partir de `main_walker_id`, et `trg_proprietes_slug` génère le slug. `get_user_apps_access()` renvoie bien la propriété (id, nom, slug, ville, rôle, is_main) dès que `main_walker_id` correspond au profil, sans dépendre d'une ligne `propriete_marcheurs`.

**8. Test réel** — Deux comptes seulement portent `app = 'frequence-jardin'` (28/08, confirmés) : aucun ne possède la clé `onboarding` (antérieurs à la nouvelle version OFJ) ; ils ont respectivement 1 et 2 propriétés créées manuellement, sans `onboarding_preferences`. Aucun compte OFJ de la nouvelle génération n'a encore été créé : la chaîne complète n'a pas encore été éprouvée de bout en bout.

## Ce qui est prêt / ce qui manque

Prêt : route d'atterrissage, RPC idempotente, droits et slug automatiques, branding FJ des six gabarits, conservation du `redirect_to`.

Manque : (a) confirmation de la liste des Redirect URLs, (b) un premier parcours réel avec la clé `onboarding`, (c) un filet si l'utilisateur confirme puis navigue ailleurs sans passer par `/jardin/bienvenue`.

## Correctifs proposés, dans l'ordre

1. **Whitelist Supabase** (action utilisateur, bloquant) — ajouter les motifs ci-dessus.
2. **Test de bout en bout** avec une adresse neuve depuis OFJ, en ouvrant l'e-mail sur un autre appareil ; vérifier `/propriete/<slug>` et la fiche dans `/admin/proprietes`.
3. **Filet de rattrapage** (LFDV, petit) — appeler `onboard_claim_from_metadata()` une fois après connexion quand `user_metadata.app = 'frequence-jardin'` et qu'aucune propriété n'est accessible, pour couvrir les confirmations qui n'atterrissent pas sur `/jardin/bienvenue`.
4. **Idempotence renforcée** (optionnel) — mémoriser l'identifiant de parcours OFJ dans les préférences pour dédoublonner même si le `garden_name` change entre deux tentatives.

Rien de tout cela n'est exécuté tant que ce plan n'est pas approuvé.
