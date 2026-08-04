# Jalon « Audit partenariat » + page web protégée

## Ce qu'on ajoute

Un 5e jalon dans « Actions réalisées », inséré **entre 1. Plaquette envoyée et 2. Fiche préparation Marche** :

```text
1. Plaquette envoyée
2. Audit partenariat        <-- nouveau
3. Fiche préparation Marche
4. Point d'avancement
5. Pack du vivant complet
```

La carte du jalon reste cochable comme les autres, et gagne un lien « Ouvrir l'audit ».

## L'audit dans l'opportunité

Clic sur « Ouvrir l'audit » → panneau plein écran, lisible, mise en page soignée (3 parties : audit SEO, audit croisé de visibilité, leviers de partenariat + les 2 propositions supplémentaires), avec :

- le contenu **intégral et rigoureusement identique** à l'audit Vienne Nature déjà produit dans notre échange (tableaux de chiffres Semrush, constats, recommandations) ;
- un bouton **« Voir la version web »** qui ouvre la page publique dans un nouvel onglet ;
- un bouton copier / imprimer.

Pour **toute autre opportunité**, le même clic ouvre un écran sobre : « Intégration de l'IA en cours » (le générateur IA arrivera en version 2).

L'association audit ↔ opportunité se fait sur l'entreprise liée (Vienne Nature). Aucun autre prospect n'a d'audit en v1.

## La page web partenaire

- URL : `/partenaires/vienne-nature`
- Accès protégé par mot de passe : `WINWIN20262037` (saisie plein écran, mémorisée pour la session du navigateur, pas de compte requis)
- Une fois déverrouillée : l'audit en version « page web » éditoriale (en-tête co-brandé Fréquence du vivant × partenaire, sommaire, sections ancrées, impression PDF propre)
- Non indexable (`noindex`), pour rester une page de négociation privée

Le répertoire `/partenaires/:slug` est conçu pour accueillir les futurs partenaires : ajouter un audit = ajouter une entrée, sans retoucher la mécanique.

## Détails techniques

- `src/lib/crmOpportunityActions.ts` : nouveau code `audit_partenariat` (icône + teinte propre), inséré en position 2. Les codes existants et les filtres URL (`?actions=`) restent valides ; la colonne `actions_realisees` est un `text[]`, aucune migration nécessaire.
- `src/lib/partnerAudits/` : registre des audits (slug, nom partenaire, société liée, contenu structuré en sections). Première entrée `vienne-nature`, contenu repris tel quel de l'audit livré (récupéré via l'historique de conversation pour garantir la fidélité).
- `src/components/crm/opportunities/PartnerAuditDrawer.tsx` : rendu de l'audit dans le CRM, ou message « Intégration de l'IA en cours » si aucun audit n'est associé.
- `src/pages/PartenaireAudit.tsx` + route publique `/partenaires/:slug` dans `App.tsx` (lazy), avec garde mot de passe (`sessionStorage`, comparaison côté client — protection d'usage, pas de secret sensible dans l'audit).
- `OpportunityActionsPicker.tsx` : grille passée à 5 cartes, bouton « Ouvrir l'audit » sur la carte du nouveau jalon.

## Hors périmètre (v2)

Questions intermédiaires et génération de l'audit par IA.
