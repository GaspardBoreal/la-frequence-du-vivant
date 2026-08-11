# Fiche entreprise — Opportunités reliées aux campagnes

Objectif : sur l'onglet « Opportunités » d'une fiche entreprise (ex. BARJANE), voir d'un coup d'œil si l'opportunité appartient à une campagne, et pouvoir rebondir vers l'opportunité dans le pipeline ou vers la campagne.

## Ce qui change visuellement

Chaque mini-carte d'opportunité gagne :

1. **Un ruban campagne** sous le badge d'étape : petite pastille « mégaphone » + nom de la campagne, teintée selon le statut de la campagne (active / planifiée / terminée). Si aucune campagne : mention discrète « Hors campagne » en gris, sans bruit visuel.
2. **Deux raccourcis de navigation** apparaissant au survol en bas de carte (et toujours visibles sur mobile) :
   - « Voir dans le pipeline » → ouvre le pipeline avec l'opportunité pré-ouverte.
   - « Voir la campagne » → ouvre la page de la campagne (masqué si hors campagne).
3. Le ruban campagne est lui-même cliquable (raccourci direct vers la campagne), avec micro-animation de survol cohérente avec le reste du CRM (framer-motion, halo primary).

Le clic sur le corps de la carte continue d'ouvrir l'édition, comme aujourd'hui. Les actions du menu « … » (Modifier / Délier / Supprimer, avec confirmation) restent inchangées.

## Détails techniques

- `src/hooks/useCompanyOpportunities.ts` : élargir le select imbriqué à `campaign:crm_campaigns(id, nom, statut)` via `crm_opportunities.campaign_id`, et exposer `campaign` sur `CompanyOpportunityRow`.
- `src/components/crm/company-tabs/CompanyOpportunitiesTab.tsx` : dans `OpportunityMiniCard`, ajouter le ruban campagne + la barre de raccourcis ; utiliser `useNavigate` avec :
  - pipeline : `/admin/crm/pipeline?opportunity=<id>` (deep-link déjà géré par `CrmPipeline`),
  - campagne : `/admin/crm/campagnes/<campaign_id>` (route existante).
  - `stopPropagation` sur ces liens pour ne pas déclencher l'édition.
- Couleurs issues des tokens du design system et des options de statut campagne existantes (`CAMPAIGN_STATUT_OPTIONS`) — aucune couleur en dur.
