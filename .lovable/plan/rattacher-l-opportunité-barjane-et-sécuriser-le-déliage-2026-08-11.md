# Rattacher l'opportunité Barjane et sécuriser le déliage

## Constat vérifié

L'opportunité « Barjane » existe toujours (statut « Relance 1 », rattachée à la campagne Financement générique), mais elle n'a plus aucun lien avec une entreprise : la table de liaison ne contient plus de ligne pour elle. C'est bien un déliage accidentel, pas une suppression.

## 1. Restaurer le lien

Recréer le lien entre l'opportunité « Barjane » et l'entreprise BARJANE (SIREN 492331343) avec le rôle « principal ». L'opportunité réapparaîtra dans l'onglet Opportunités de la fiche entreprise, sans rien perdre de son historique ni de son rattachement campagne.

## 2. Confirmation avant de délier

Dans l'onglet Opportunités d'une fiche entreprise, l'action « Délier de l'entreprise » déclenche aujourd'hui la suppression du lien immédiatement, sans filet. Ajout d'une fenêtre de confirmation explicite :

- Titre : « Délier cette opportunité ? »
- Texte : rappelle le nom de l'opportunité et de l'entreprise, et précise que l'opportunité n'est pas supprimée mais qu'elle ne sera plus visible depuis cette fiche.
- Boutons : « Annuler » (par défaut) et « Délier » en teinte d'avertissement.

Même traitement de sécurité conservé pour « Supprimer » (déjà confirmé, mais passage à la même boîte de dialogue soignée plutôt qu'au `confirm()` natif du navigateur, pour la cohérence visuelle).

## Détails techniques

- Restauration : insertion d'une ligne dans `crm_opportunity_companies` (`opportunity_id` = opportunité Barjane, `company_id` = BARJANE, `role` = `primary`).
- UI : `src/components/crm/company-tabs/CompanyOpportunitiesTab.tsx` — remplacement de l'appel direct `handleUnlink` par un `AlertDialog` shadcn piloté par un état local (opportunité ciblée + type d'action), avec tokens sémantiques existants.
