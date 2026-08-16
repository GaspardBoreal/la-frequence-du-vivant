# Nettoyage du projet dérivé « Onboarding Fréquence Jardin »

Objectif : après le remix, réduire le projet de Laurent TRIPIED au strict périmètre onboarding + espace Jardin, sans toucher au projet central ni à la base partagée.

## Principe de sécurité

Le projet dérivé partage la même base Supabase que le projet central. Tout ce qui est retiré côté dérivé n'est qu'un retrait de routes et d'écrans : **aucune migration, aucune suppression de table, aucune modification de RLS ou d'Edge Function** ne doit être faite depuis ce projet. Les règles d'accès continuent d'être portées par la base (RLS + RPC `SECURITY DEFINER`), donc retirer une page ne retire aucun droit et laisser une page ne donne aucun droit supplémentaire.

## Périmètre conservé dans le projet dérivé

- `/jardin/demarrer` — l'onboarding autonome (ouvrir / créer / rejoindre un jardin, génération de codes d'invitation)
- `/propriete/:slug` — l'espace Jardin complet (J'observe, J'analyse, J'identifie, Le tri, Palette végétale, Chantier, Clinique, IA de jardin)
- `/jardin/:slug` — la fiche jardin publique
- `/marches-du-vivant/connexion` — l'écran de connexion partagé
- L'écran d'accueil multi-espaces après connexion
- `/` — page d'accueil, à simplifier ensuite vers une entrée « Fréquence Jardin »

## Périmètre retiré dans le projet dérivé

Familles de routes à supprimer de `src/App.tsx` (et imports associés) :

1. **Administration** : toutes les routes `/admin/*` y compris `/admin/login`, `/admin/crm/*`, `/admin/iot`, `/admin/outils/*`, `/admin/roadmap`, `/admin/adhesions`, plus `/access-admin-gb2025`
2. **CRM & partenaires** : `/partenaires/*`, `/partenaire-iot/:slug`, `/trust-in-frequence-vivant*`, `/audit-frugal/:slug`, `/offre-vdt-mdv`, `/interreg-sudoe-mdv`
3. **Marches du vivant & communauté** : `/marches-du-vivant/*` sauf `connexion`, `/marche/:slug`, `/m/:slug`, `/apprendre/:slug`, `/marcheur/:slug/carnet`, `/adhesion`
4. **Explorations & livre vivant** : `/explorations*`, `/galerie-fleuve*`, `/lecteurs/*`, `/epub/*`, `/dordonia`, `/bioacoustique*`, `/traversees`
5. **Divers** : `/roadmap*`, `/etude-de-sol`, `/api-mcp`, `/meteo-historique`, `/atlas-climatique`, `/presentation`, `/formations/*`, `/partage/:id`, `/test-ebird`, `/favicon-test`, `/materiel-pedagogique`

## Ordre d'exécution

1. **Vérifier le remix** : ouvrir le projet dérivé, confirmer que `/jardin/demarrer` et `/propriete/:slug` fonctionnent et que la connexion se fait bien sur la base partagée.
2. **Élaguer les routes** dans `src/App.tsx`, famille par famille dans l'ordre ci-dessus, en vérifiant le build après chaque famille.
3. **Supprimer les fichiers de pages devenus orphelins** (uniquement ceux qui ne sont plus référencés), en laissant intacts les composants partagés de `src/components/propriete/`, `src/hooks/propriete/`, les cartes et le chat.
4. **Simplifier l'accueil** `/` : une entrée unique « Démarrer mon jardin » + « Me connecter ».
5. **Adapter le `<head>`** : titre et description propres au produit Onboarding Fréquence Jardin.
6. **Vérifier** : parcours complet créer un jardin → ouvrir l'espace → une étape d'analyse → IA de jardin, en tant que compte non-admin.

## Détails techniques

- Le fallback `*` (NotFound) doit rester en dernière position après l'élagage.
- Les imports `lazyWithRetry` des pages retirées doivent être supprimés en même temps que leurs routes, sinon le bundle continue de les embarquer.
- `AdminAuth` et les hooks admin peuvent rester dans le dépôt sans risque ; ils ne sont plus atteignables sans route. Les supprimer est optionnel, à faire seulement une fois les routes retirées et le build vert.
- La remontée du travail de Laurent vers le projet central se fera par comparaison manuelle des fichiers de `src/pages/JardinDemarrer.tsx`, `src/components/propriete/` et `src/hooks/propriete/` — ce sont les seuls dossiers qu'il doit modifier.

## Règle de collaboration à poser dès le départ

Laurent modifie uniquement : `src/pages/JardinDemarrer.tsx`, `src/components/propriete/**`, `src/hooks/propriete/**`, et l'accueil du projet dérivé. Toute demande de changement de base de données remonte au projet central.
