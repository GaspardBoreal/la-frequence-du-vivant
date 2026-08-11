# Transférer un prospect / une opportunité d'une campagne à une autre

Objectif : pouvoir déplacer, en deux clics et depuis n'importe quel écran CRM, un prospect (membre de campagne) ou une opportunité vers une autre campagne — et notamment rattacher Barjane à « Campagne FONCIERES, LOGISTIQUE et GESTIONNAIRES DE SITES ETENDUS ».

## Ce qui existe aujourd'hui

- Deux campagnes actives : « FINANCEMENT GENERIQUE » (101 membres) et la nouvelle « FONCIERES, LOGISTIQUE et GESTIONNAIRES DE SITES ETENDUS » (0 membre).
- Le tableau des membres d'une campagne permet seulement : appeler, ouvrir l'opportunité, retirer le prospect.
- La fiche entreprise → onglet Opportunités affiche le ruban campagne (cliquable pour naviguer) mais ne permet pas de changer de campagne.
- Un lien automatique existe déjà entre opportunité et membre de campagne (synchronisation des statuts).

Conclusion : il manque une seule et même action, « Transférer vers une autre campagne », à exposer à trois endroits.

## Ce qui sera construit

### 1. Un sélecteur unique de transfert (nouveau composant partagé)
Une boîte de dialogue « Transférer vers une campagne » : liste des campagnes actives avec leur couleur de statut et leur nombre de membres, campagne actuelle marquée, recherche si la liste s'allonge, résumé clair de ce qui va se passer (« Barjane quitte FINANCEMENT GENERIQUE et rejoint FONCIERES… ») et confirmation explicite avant validation.

Règle de cohérence appliquée à chaque transfert :
- le prospect (membre) est déplacé en conservant son historique d'appels, ses tentatives, son statut d'appel et ses notes ;
- si le prospect a une opportunité liée, l'opportunité suit automatiquement la même campagne ;
- si l'entreprise est déjà membre de la campagne cible, on fusionne au lieu de créer un doublon ;
- une opportunité sans campagne peut être rattachée (« Hors campagne » → campagne choisie), et on peut aussi la détacher.

### 2. Trois points d'entrée
- **Tableau des membres d'une campagne** : une action « Transférer » par ligne, plus une sélection multiple avec transfert groupé (utile pour rebasculer d'un coup les prospects fonciers/logistiques vers la nouvelle campagne).
- **Fiche entreprise → onglet Opportunités** : le ruban campagne devient actionnable — clic gauche = naviguer (comportement actuel conservé), petit bouton « changer » = ouvrir le sélecteur. Les opportunités « Hors campagne » affichent « Rattacher à une campagne ».
- **Carte / fiche d'opportunité du pipeline** : même entrée « Campagne » dans le menu d'actions.

### 3. Cas Barjane
Une fois la fonction en place, Barjane sera rattachée (fiche prospect + opportunité) à « Campagne FONCIERES, LOGISTIQUE et GESTIONNAIRES DE SITES ETENDUS » via cette nouvelle action, avec vérification des compteurs des deux campagnes.

## Détails techniques

- Nouveau composant `src/components/crm/campaigns/TransferCampaignDialog.tsx` (dialog + liste de campagnes + confirmation).
- Nouvelle mutation `transferToCampaign` dans `src/hooks/useCrmCampaigns.ts` :
  - met à jour `crm_campaign_members.campaign_id` (ou crée la ligne si l'entrée part d'une opportunité sans membre) ;
  - met à jour `crm_opportunities.campaign_id` de l'opportunité liée ;
  - gère le conflit d'unicité `(campaign_id, company_id)` : si la cible contient déjà l'entreprise, on conserve la ligne existante en y reportant les champs d'appel les plus récents et on supprime la ligne source ;
  - invalide `crm-campaign-members`, `crm-campaign-memberships`, `crm-campaigns-overview`, `campaign-stats`, `campaign-daily`, `crm-opportunities`, `company-opportunities`.
- Sélection multiple dans `CampaignMembersTable.tsx` (cases à cocher + barre d'actions contextuelle).
- `CompanyOpportunitiesTab.tsx` : ruban campagne scindé en zone navigation + bouton de changement ; `useCompanyOpportunities` fournit déjà `campaign`.
- Aucune migration de schéma nécessaire : `campaign_id` existe sur `crm_opportunities` et `crm_campaign_members`, et le trigger de synchronisation reste valable.
