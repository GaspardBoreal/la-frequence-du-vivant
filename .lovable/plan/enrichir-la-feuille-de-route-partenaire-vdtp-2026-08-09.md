# Enrichir la feuille de route partenaire (VDTP)

Trois ajouts sur la feuille de route, visibles à la fois sur la page web `/partenaires/vdtp/2026-08-12` et dans le panneau partenaire du CRM.

## A. Un sommaire toujours visible

Une barre de navigation collante en haut du document, avec les cinq entrées :

```text
01 Entretien   02 Lecture d'ensemble   03 Chantiers   04 Planning   05 Extraits
```

- Clic = défilement doux vers la section.
- L'entrée correspondant à la section à l'écran s'illumine automatiquement pendant le défilement.
- Sur mobile, la barre devient une bande défilante horizontale ; en version imprimée elle disparaît.
- Dans le CRM, la barre se cale sous l'en-tête du panneau et défile à l'intérieur du panneau.

## B. Avancement des chantiers, modifiable à la main

Chaque chantier gagne un sélecteur d'état à trois positions : **À faire / En cours / Fait**.

- L'état est enregistré en base : il est le même pour vous, pour le CRM et pour la page partenaire, sur tous les appareils.
- Retour immédiat à l'écran (l'état bascule avant même la confirmation serveur), avec message d'erreur si l'enregistrement échoue.
- Un chantier « Fait » se grise légèrement et se barre discrètement ; « En cours » prend un liseré ambre animé.
- Chaque priorité (P0…P6) affiche une barre d'avancement (« 3/5 chantiers livrés ») et l'en-tête du document un compteur global.
- L'état repris tel quel dans le PDF imprimé.

Note d'accès : la page est protégée par mot de passe et non indexée, mais toute personne disposant du mot de passe pourra modifier les états. Si vous préférez un verrou administrateur, dites-le et je restreins l'écriture.

## C. Un prompt Lovable prêt à coller, par chantier

Sur chaque chantier, un bouton **« Copier le prompt »** met dans le presse-papiers un brief complet et structuré, construit à partir des données déjà présentes :

- le contexte de l'entretien (le sujet rattaché + le verbatim de Vincent Levavasseur qui le motive) ;
- l'objectif du chantier et le livrable attendu (« Produit : … ») ;
- le rang de priorité, la fenêtre de réalisation et la charge estimée ;
- un cadre d'exigences constant : direction artistique du projet (thèmes clair/sombre, tokens sémantiques, jamais de couleur en dur), sobriété informationnelle, nommage français des espèces, robustesse (états de chargement, erreurs, données vides), et critères d'acceptation vérifiables.

Le bouton confirme la copie (« Prompt copié »). Un second bouton discret permet de copier le prompt en Markdown pour l'archiver.

## Détails techniques

- **Base** : nouvelle table `partner_roadmap_task_status` (`roadmap_slug`, `roadmap_date`, `priority_code`, `task_key`, `status`, `updated_at`), clé unique sur les quatre premiers champs. `task_key` = slug du titre du chantier (stable). GRANT + RLS : lecture et écriture ouvertes (page protégée par mot de passe), `service_role` complet.
- **Hook** `useRoadmapTaskStatus(slug, date)` : chargement groupé, `upsert` optimiste, invalidation React Query ; réutilisé par la page publique et le drawer CRM.
- **Statut effectif** = valeur en base si présente, sinon `task.status` du fichier `vdtpRoadmap.ts` (aucune migration de données nécessaire).
- **`RoadmapTocNav.tsx`** (nouveau) : ancres `#roadmap-01`…`#roadmap-05`, `IntersectionObserver` pour la section active, `print:hidden`, variante `embedded` pour le drawer.
- **`PartnerRoadmapContent.tsx`** : `id` sur chaque `<section>`, `StatusPill` remplacé par un `RoadmapTaskStatusControl` (3 boutons segmentés), barre d'avancement par priorité, bouton de prompt.
- **`src/lib/partnerRoadmaps/prompt.ts`** (nouveau) : `buildLovablePrompt(roadmap, priority, task)` — assemblage du brief ; testable isolément.
- **`RoadmapPrintLayout.tsx`** : lecture du même statut effectif ; boutons et sommaire exclus de l'impression.
- **`PartnerAuditDrawer.tsx`** : insertion du sommaire en mode `roadmap`.
