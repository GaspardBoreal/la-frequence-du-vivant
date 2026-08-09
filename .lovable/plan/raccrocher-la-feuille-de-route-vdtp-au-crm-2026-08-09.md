# Raccrocher la feuille de route VDTP au CRM

L'opportunité existe déjà en base : **« VDTP / Offre Jardin nourricier »** (entreprise « VER DE TERRE PRODUCTION », contact Vincent Levavasseur, statut Relance 3). Aucune donnée à créer côté base : il manque seulement le **rattachement du dossier partenaire VDTP** à cette opportunité.

Aujourd'hui le panneau partenaire du CRM ne sait reconnaître que les partenaires ayant un *audit* (Vienne Nature). VDTP n'a pas d'audit, mais une feuille de route — donc rien ne s'affiche.

## Ce qu'on met en place

**1. Une entrée partenaire VDTP**
Déclaration d'un partenaire « VDTP / Ver de Terre Production » avec ses mots-clés de reconnaissance (VDTP, Ver de Terre Production, Levavasseur, Jardin nourricier). Dès qu'une opportunité contient l'un de ces termes dans son titre, son entreprise ou une société liée, le dossier partenaire se rattache automatiquement.

**2. Un onglet ROADMAP dans le panneau partenaire**
Le panneau partenaire ouvert depuis l'opportunité gagne un troisième onglet, à côté de « Version synthétique » et « Version détaillée » :

```text
[ Synthétique ]  [ Détaillée ]  [ Feuille de route ]
```

- Pour Vienne Nature : les 3 onglets (audit + éventuelle roadmap si ajoutée plus tard).
- Pour VDTP : seul l'onglet **Feuille de route** est proposé et s'ouvre par défaut — plus de message « Intégration de l'IA en cours ».
- Contenu identique à la page publique `/partenaires/vdtp/2026-08-12` : 12 sujets d'entretien, verbatims, chantiers P0→P6, graphes de charge, frise.

**3. Les actions attendues dans l'en-tête**
- **Imprimer** : génère le PDF A4 de la feuille de route (même moteur d'impression que la page publique).
- **Voir la version web** : ouvre `/partenaires/vdtp/2026-08-12` dans un nouvel onglet.
- **Copier le lien** : copie l'URL avec le mot de passe `WINWIN20262037`.

**4. L'accès depuis l'opportunité**
Dans la liste des actions de l'opportunité, l'action « Audit partenariat » affiche un bouton d'ouverture ; pour un partenaire sans audit mais avec feuille de route, le libellé devient **« Ouvrir la feuille de route »**. Le panneau reste accessible via le même bouton, sans nouvelle action à cocher.

## Détails techniques

- `src/lib/partnerRoadmaps/types.ts` : ajout d'un champ `matchers: string[]` et `partnerName` sur `PartnerRoadmap` (si absent).
- `src/lib/partnerRoadmaps/index.ts` : ajout de `resolvePartnerRoadmap(candidates)` sur le modèle de `resolvePartnerAudit`, et renseignement des matchers dans `vdtpRoadmap.ts`.
- `src/components/partners/PartnerAuditViewSwitcher.tsx` : type de vue étendu à `'roadmap'`, options rendues dynamiquement selon les onglets disponibles.
- `src/components/crm/opportunities/PartnerAuditDrawer.tsx` : nouvelle prop `roadmap`; rendu de `PartnerRoadmapContent` pour la vue roadmap ; impression via `usePartnerRoadmapPrint` + `RoadmapPrintLayout` quand la vue active est la feuille de route ; en-tête (titre, sous-titre, lien web, mot de passe) piloté par le dossier actif ; l'état vide « IA en cours » n'apparaît plus que si ni audit ni roadmap.
- `src/components/crm/OpportunityForm.tsx` : résolution de la roadmap à partir des mêmes candidats (titre / entreprise / sociétés liées) et passage au drawer.
- `src/components/crm/opportunities/OpportunityActionsPicker.tsx` : libellé du bouton adapté (audit vs feuille de route).
- Aucune migration ni écriture en base.
