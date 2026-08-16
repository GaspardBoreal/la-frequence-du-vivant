# Débloquer lt@bziiit.com — retirer Google Search Console du projet dérivé

Objectif : que `lt@bziiit.com` puisse ouvrir **Onboarding Fréquence Jardin** ce soir, sans partager de connexion personnelle.

Le blocage vient d'une connexion **Google Search Console** appartenant à Gaspard, héritée du remix. Elle n'est utile qu'au site central (SEO), pas à l'onboarding. On la retire du projet dérivé.

## Étapes (à faire dans le projet Onboarding Fréquence Jardin, par Gaspard)

1. Ouvrir le projet **Onboarding Fréquence Jardin**.
2. Dans le chat du projet dérivé, demander : « Déconnecte la connexion Google Search Console de ce projet, je ne l'utilise pas ici. »
   - L'assistant du projet dérivé lancera la déconnexion du connecteur au niveau projet.
   - Alternative manuelle : Project Settings → Integrations / Connections → Google Search Console → **Disconnect**.
3. Recharger le projet, puis demander à `lt@bziiit.com` de rouvrir le lien du projet.

## Points importants

- La déconnexion ne supprime pas la connexion de Gaspard : elle reste intacte et active dans le **projet central**, donc les analyses SEO ne sont pas impactées.
- Aucun code n'est modifié, aucune donnée Supabase n'est touchée : c'est un réglage projet réversible.
- Si Laurent a besoin plus tard d'un outil SEO dans l'onboarding, on repartagera la connexion proprement, ou il créera la sienne.

## Vérification

Après la déconnexion, `lt@bziiit.com` doit voir le projet s'ouvrir normalement, sans le message « This project uses connections you can't access ». Si le message persiste, le cache de session peut être en cause : déconnexion / reconnexion de son compte Lovable.
