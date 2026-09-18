# Tracer tous les usages dans un jardin

## Ce qui se passe aujourd'hui

Vérifié en base et dans le code :

- Aucune trace de type `propriete_view` n'existe dans le journal d'activité : les seuls types enregistrés sont `session_start`, `tab_switch`, `page_view`, `feed_seen`, `feed_clicked`, `media_upload`, `tool_use`.
- Le petit utilitaire prévu pour tracer les jardins (`useProprieteTracker`) a bien été créé, mais **il n'est appelé nulle part** : ni la page du jardin, ni les sous-écrans (Intention, Entretiens, Galerie, Cadastre…). Donc rien ne part vers la base.
- Deuxième défaut : cet utilitaire lit l'identité via le contexte d'administration, alors que la page du jardin utilise la connexion communauté. Même branché tel quel, il n'aurait rien écrit pour un marcheur connecté comme Gaspard Boréal.
- Les droits et règles d'accès de la table de journal sont corrects (un marcheur connecté peut écrire ses propres traces) : aucune migration n'est nécessaire.

## Correctif proposé

1. **Réparer l'utilitaire de traçage du jardin**
   - Lire l'identité via la connexion communauté (celle réellement utilisée sur `/propriete/...`).
   - Permettre de transmettre des informations libres (nom du jardin, sous-écran, élément cliqué).

2. **Brancher le traçage sur la page du jardin**
   - À l'ouverture du jardin : une trace « ouverture du jardin » avec l'identifiant et le nom.
   - À chaque changement d'onglet : Portrait, J'observe, J'analyse, J'identifie, Synthèse, Palette/Atelier, Capteurs, Clinique, Tour de jardin.
   - À chaque changement de sous-onglet Portrait : Galerie, Cadastre, **Intention**, **Entretiens**.
   - À l'ouverture de l'Atelier du jardin et à sa fermeture.

3. **Tracer les clics importants à l'intérieur des écrans**
   Traces d'action (pas seulement d'ouverture), avec le module concerné :
   - Intention : ouverture d'une carte question, enregistrement, export.
   - Entretiens : ouverture d'une fiche, lancement de la collecte, validation, révision.
   - Tour de jardin : ouverture d'un tour, ouverture d'une fiche action, passage « réalisée », ajout au carnet, envoi du carnet.
   - Analyse de sol / Identification / Palette / Capteurs : ouverture d'un point, d'une espèce, d'une sonde.
   - Assistant du Jardin : ouverture, envoi d'une question (le contenu reste déjà enregistré côté conversation).

4. **Fiabiliser l'envoi**
   - Réduire le délai d'attente avant écriture et vider la file en attente quand on quitte la page (changement d'onglet navigateur ou fermeture), pour ne plus perdre les dernières traces.
   - Ne pas doublonner une même ouverture répétée en quelques secondes.

5. **Restituer dans l'onglet Parcours**
   - La chronologie affiche déjà ces traces ; vérifier que le libellé du jardin et du module apparaît lisiblement (par exemple « Les Hortensias — Intention »).

## Détails techniques

- `src/hooks/useProprieteTracker.ts` : passer de `useAuth` à `useCommunityAuth`, signature `(module, action, cible, extra?)`, écriture `event_type='propriete_view'`, `event_target='module:cible'`, `metadata = { propriete_id, propriete_nom, module, action, cible }`.
- `src/hooks/useActivityTracker.ts` : délai ramené à ~500 ms, flush sur `visibilitychange`/`pagehide`, clé de déduplication incluant `propriete_id`.
- `src/pages/ProprieteEspace.tsx` : appel dans un `useEffect` au montage (ouverture jardin), dans `handleTabChange`, `goPortrait`, `openAtelier`/`closeAtelier`, et passage du traceur en prop/contexte léger aux sous-composants concernés (`PortraitIntention`, `PortraitEntretiens`, `TourDetail`, `TabAnalyze`, `TabIdentify`, panneau capteurs, `ChatBot` jardin).
- Aucune modification de base de données : la table, les droits et les règles d'accès sont déjà en place.

## Vérification

- Se connecter en marcheur, ouvrir Les Hortensias, passer sur Intention puis Entretiens.
- Contrôler en base que des lignes `propriete_view` apparaissent avec le bon jardin et le bon module.
- Ouvrir `/admin/community` → onglet Parcours, sélectionner le marcheur et confirmer l'affichage dans la chronologie du jour.
