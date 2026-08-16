# Onboarding Fréquence Jardin — prochaines étapes

Le projet dérivé est en place, l'écran `/admin/parametrage` inventorie les 10 secrets et la Search Console est reliée. Voici la suite, par ordre de priorité.

## Point de vigilance à traiter en premier

Les deux projets partagent la même base Supabase. Les secrets d'Edge Functions ne vivent pas dans le projet Lovable mais dans le projet Supabase partagé : **créer un secret depuis le projet dérivé le crée pour tout le monde, et déployer une Edge Function depuis le dérivé écrase celle du projet central**. Conséquence directe sur la répartition du travail :

- Les valeurs de secrets se posent **une seule fois**, depuis le projet central.
- Laurent ne doit jamais créer, modifier ni redéployer de fichier sous `supabase/functions/**` ni lancer de migration depuis le projet dérivé.
- L'écran `/admin/parametrage` reste un tableau de bord de lecture : il affiche l'état, il ne pose pas les valeurs.

## Étape 1 — Poser les 10 valeurs de secrets (projet central)

Depuis le projet central, créer les valeurs via le formulaire sécurisé, dans cet ordre de dépendance fonctionnelle :

1. SMTP (envoi des invitations et des mails de compte) — c'est le bloc bloquant pour l'onboarding
2. Clés IA (IA de jardin, résumés éditoriaux, reconnaissance photo)
3. Secrets partagés de webhooks (IoT Brad, backfill iNaturalist)

Après chaque bloc, vérifier une fonction représentative par un appel réel et lire ses logs, plutôt que de se fier au statut affiché.

## Étape 2 — Verrouiller le périmètre d'écriture de Laurent

Poser la règle dans le projet dérivé, en clair dans le README du projet :

- Autorisé : `src/pages/JardinDemarrer.tsx`, `src/components/propriete/**`, `src/hooks/propriete/**`, l'accueil et le paramétrage
- Interdit : `supabase/**`, tout `/admin/*` hors `/admin/parametrage`, tout ce qui touche au CRM, à l'IoT et aux marches

## Étape 3 — Terminer l'élagage des routes

Reprendre le plan de nettoyage déjà validé, avec l'exception `/admin/parametrage` (et `AdminAuth` + sa carte d'accès conservés). Familles restantes à retirer : explorations et livre vivant, marches du vivant hors connexion, partenaires et IoT, roadmap et pages publiques annexes. Build vérifié après chaque famille.

## Étape 4 — Éprouver le parcours d'onboarding de bout en bout

Avec un compte neuf non-admin, sur le projet dérivé :

1. Créer un compte, recevoir le mail (dépend de l'étape 1)
2. `/jardin/demarrer` → créer un jardin, vérifier le slug et le rôle `proprietaire`
3. Ouvrir l'espace, faire une étape J'observe et une étape J'analyse
4. Générer un code d'invitation, le consommer depuis un second compte, vérifier le rôle `prestataire`
5. Poser une question à l'IA de jardin

Chaque échec est consigné avec la fonction concernée, pas seulement le message d'écran.

## Étape 5 — Boucle de remontée vers le projet central

Définir le rythme : Laurent signale ses lots terminés, on compare les trois dossiers autorisés et on reporte les changements dans le projet central. Rien ne remonte automatiquement.

## Détails techniques

- Les Edge Functions à surveiller après la pose des secrets : `send-smtp-email`, `elevenlabs-tts`, `audio-transcription`, `marche-editorial-summary`, `recognize-marcheur-photos`, `iot-webhook-brad`, `backfill-marcheur-inat-batch`.
- Les deux secrets partagés générés par `openssl rand -hex 32` doivent avoir la même valeur des deux côtés de l'appel (émetteur du webhook et fonction réceptrice) : les créer une fois, puis les transmettre aux partenaires par un canal privé.
- Le fallback `*` (NotFound) reste en dernière position de `src/App.tsx` après l'élagage, et les imports `lazyWithRetry` des pages retirées partent avec leurs routes.
