# Pédagogie « De l'observation à l'espèce » — rassurer & former les marcheurs

## Principe directeur

Ne **rien changer** au pipeline d'ingestion (qualité scientifique préservée), mais **rendre visible et désirable** le chemin entre « ce que je photographie » et « ce qui apparaît dans la marche ». Transformer un filtrage silencieux (frustrant) en un **rite de passage** valorisant la communauté iNaturalist.

## Concept narratif : « Le Seuil du Vivant »

Chaque observation traverse un seuil. Ce qui passe entre dans la mémoire collective de la marche. Ce qui attend est tout aussi précieux — c'est la matière vivante en cours d'identification.

Trois états poétiques affichés au marcheur :

```
   📸 Posée            🔍 En attente d'œil           🌿 Reconnue
  (sur iNat)          (genre / informel)           (espèce validée
                                                    → entre dans la marche)
```

Aucune obs n'est « perdue » : elle est simplement à un autre stade de son chemin.

## Proposition d'expérience

### 1. Panneau « Vos observations en chemin » (onglet Contributions du marcheur)

Sous le bandeau actuel « 4 espèces identifiées », ajouter une **bande douce** non intrusive :

```
┌─────────────────────────────────────────────────────────┐
│  🌿 4 espèces reconnues  ·  ⏳ 7 en chemin sur iNat     │
│  [Voir mes observations en cours d'identification →]    │
└─────────────────────────────────────────────────────────┘
```

Au clic → drawer pédagogique (voir §2). Le compteur « 7 en chemin » est calculé côté client en interrogeant **directement l'API iNat publique** (`user_login + lat/lng + radius`) **sans toucher au backfill** — c'est de la lecture éphémère, pas de l'ingestion.

### 2. Drawer « Le Seuil du Vivant » (inspirant, non technique)

Trois sections rythmées :

**a) Pourquoi ce seuil existe**
> « Une espèce n'est jamais reconnue par une personne seule. Sur iNaturalist, c'est un collectif mondial qui confirme — botanistes, ornithologues, naturalistes amateurs. C'est ce qui rend chaque marche scientifiquement précieuse. »

Une mini-frise :
```
Vous postez → 1 naturaliste confirme → 2ème confirme
            → Grade Recherche → Entre dans la marche
```

**b) Vos 7 observations en attente**
Liste sobre, chaque ligne = 1 obs iNat avec :
- vignette photo
- état actuel (« Genre identifié », « Sans taxon », « En attente d'avis »)
- 1 action contextuelle :
  - *Sans taxon* → « Demander une suggestion IA iNat » (lien deep-link `identify` iNat)
  - *Genre* → « Préciser l'espèce » (lien identify)
  - *Informel* → « Ajouter une seconde photo » (conseil)

Aucun jugement, juste des **gestes activables** qui font progresser l'obs.

**c) Comment aider les autres**
> « Vous savez reconnaître une plante ? 30 sec sur iNat suffisent à faire passer le seuil à une obs d'un autre marcheur. »

Bouton → liste des obs « en attente » de la marche, tous marcheurs confondus (drawer curateur seulement, ou ambassadeur+).

### 3. Micro-pédagogie contextuelle (badge tooltip)

Sur le badge onglet « Contributions 4 », ajouter au survol/long-press un tooltip court :

> « 4 espèces reconnues par la communauté iNat. Vos autres obs sont en chemin — touchez ici pour les voir. »

Zéro changement visuel par défaut — la pédagogie s'active **à la demande**.

### 4. Onboarding « Première observation » (one-shot)

À la **première fois** qu'un marcheur a un écart obs iNat > obs reconnues, une carte douce s'affiche une seule fois (puis `localStorage`), avec animation de seuil :

```
✨ Saviez-vous ?
Vos photos vivent leur vie sur iNaturalist.
Quand 2 naturalistes confirment, elles rejoignent la marche.
C'est ce qui rend nos données fiables et publiables.
[J'ai compris]  [Voir mes obs en chemin →]
```

### 5. Page « Le chemin du Vivant » (statique, /marches-du-vivant/seuil-du-vivant)

Une page éditoriale courte (mobile-first, scroll narratif) accessible depuis :
- le drawer §2 (« en savoir plus »)
- le hub Outils marcheur
- les emails de bienvenue

Contenu :
- *Pourquoi la qualité avant la quantité*
- *Comment iNat fonctionne* (Grade Recherche en 3 étapes)
- *Le rôle du marcheur* (poster sans peur, l'identification viendra)
- *Témoignage* d'un naturaliste iNat français (à recueillir plus tard)
- *FAQ* : « Ma photo n'apparaît pas — est-elle perdue ? » / « Combien de temps pour validation ? » / « Puis-je aider ? »

### 6. Notification douce de passage (optionnel, phase 2)

Quand une obs « en chemin » passe Grade Recherche et entre dans la marche : push email/in-app :
> « 🌿 Votre *Fatsia japonica* du 5 juin a franchi le Seuil. Elle rejoint la mémoire de la marche ISEG. »

Nourrit la motivation. Techniquement : cron diff entre 2 backfills consécutifs.

## Ce qui n'est PAS modifié

- ❌ Pas de changement à `backfill-marcheur-inaturalist` (filtre `!sciName` conservé)
- ❌ Pas d'insertion en `marcheur_observations` des obs non validées
- ❌ Pas d'impact sur Fréquence, snapshots, compteurs espèces, export Pack Vivant
- ❌ Pas de modif RLS ni de migration DB pour les §1-5

## Détails techniques minimaux

### Fichiers à créer / modifier
- **Nouveau** `src/hooks/useMarcheurInatPending.ts` — appel direct `https://api.inaturalist.org/v1/observations?user_login=...&lat/lng/radius=...` côté client, cache React Query 10 min, **sans** persistance Supabase. Filtre côté client : obs absentes de `marcheur_observations.inaturalist_observation_id`.
- **Nouveau** `src/components/community/exploration/marcheurs/SeuilDuVivantDrawer.tsx` — drawer §2 (réutilise `Sheet` shadcn).
- **Nouveau** `src/components/community/exploration/marcheurs/EnCheminBanner.tsx` — bande §1.
- **Modif** `MarcheursTab.tsx` (`ContributionsSubTab`) — insertion banner + branchement drawer.
- **Modif** `MarcheursTab.tsx` — tooltip §3 sur le badge onglet.
- **Nouveau** `src/components/community/onboarding/SeuilOnboardingCard.tsx` — carte §4 + clé `localStorage` `seuil-onboarding-seen-v1`.
- **Nouvelle page** `src/pages/SeuilDuVivant.tsx` + route + lien dans Outils.
- **Phase 2 (optionnel)** edge function `notify-seuil-crossing` (cron quotidien diff) + table `marcheur_seuil_notifications`.

### Mesure d'impact (à ajouter au plan)
Tracker (via `useActivityTracker` existant) :
- ouverture drawer Seuil
- clics « Préciser l'espèce » / « Demander suggestion »
- vue page éditoriale

But : valider que la pédagogie réduit la confusion sans pousser au sur-upload.

## Mémoire à ajouter après implémentation
`mem://features/community/seuil-du-vivant-pedagogy` — Concept « Seuil du Vivant » : on n'ingère que les obs validées iNat ; les obs en chemin sont montrées en lecture éphémère via API iNat directe, avec drawer pédagogique inspirant. Aucune mutation Supabase.

## Recommandation
Phase 1 = §1 + §2 + §3 (1 hook, 2 composants, 1 modif). Effet pédagogique immédiat, zéro risque backend. §4 + §5 + §6 ensuite si l'engagement le justifie.
