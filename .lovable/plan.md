# Correction de l'échec d'import éclair

## Le problème

L'import échoue avec « there is no unique or exclusion constraint matching the ON CONFLICT specification ».

L'enrôlement en campagne écrit dans la table des membres de campagne en demandant à la base d'ignorer les doublons sur le couple (campagne, société). Or cette table n'a aujourd'hui aucune contrainte d'unicité sur ce couple : la base refuse donc l'opération et tout l'enrôlement échoue.

Vérifié en base : aucune contrainte ni index unique sur (campagne, société), et aucun doublon existant — l'ajout de la règle d'unicité passera sans conflit.

## La correction

1. Ajouter en base une règle d'unicité sur le couple (campagne, société) dans la table des membres de campagne, pour les lignes rattachées à une société.
2. Conserver le comportement « ignorer les doublons » de l'import : une société déjà membre de la campagne ne créera plus d'erreur ni de doublon.
3. Ajuster le récapitulatif d'import pour compter correctement les enrôlements quand certaines sociétés étaient déjà membres (relire les membres du couple campagne/société après écriture, plutôt que de se fier aux seules lignes insérées), afin que la création d'opportunités reste cohérente.

## Détails techniques

- Migration : `CREATE UNIQUE INDEX crm_campaign_members_campaign_company_uniq ON public.crm_campaign_members (campaign_id, company_id) WHERE company_id IS NOT NULL;`
- `src/components/crm/PasteImportDialog.tsx` : garder `upsert(..., { onConflict: 'campaign_id,company_id', ignoreDuplicates: true })`, puis faire un `select` des membres par `campaign_id` + `company_id in (...)` pour récupérer les `id` (l'upsert avec `ignoreDuplicates` ne retourne pas les lignes déjà existantes) et alimenter la boucle de création d'opportunités.
