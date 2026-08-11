# Correction définitive de l’import éclair

## Diagnostic confirmé

La base possède deux index uniques **partiels** sur `(campaign_id, company_id)`, avec la condition `company_id IS NOT NULL`. PostgREST ne peut pas les utiliser pour le `ON CONFLICT (campaign_id, company_id)` envoyé par l’import éclair, d’où l’erreur persistante.

La migration précédente a donc ajouté un second index du même type sans corriger la cause. La table contient actuellement 101 membres, aucun `company_id` nul et aucun doublon campagne/société détecté.

## Correction

1. Remplacer les deux index uniques partiels redondants par une contrainte unique standard sur `(campaign_id, company_id)` afin que tous les `upsert` CRM puissent résoudre le conflit correctement.
2. Conserver la compatibilité des données existantes et les règles d’accès actuelles.
3. Vérifier les trois chemins qui utilisent cette clé : import éclair, enrôlement manuel et transfert vers une autre campagne.
4. Rejouer le scénario d’import depuis la campagne ouverte et confirmer qu’une société déjà enrôlée est ignorée proprement au lieu de faire échouer tout le lot.
5. Vérifier les compteurs et les liens campagne/opportunité après l’import.

## Détail technique

La correction sera réalisée par migration Supabase : suppression des deux index partiels, puis ajout d’une contrainte `UNIQUE (campaign_id, company_id)` réellement compatible avec l’option `onConflict: 'campaign_id,company_id'` déjà utilisée par le frontend.