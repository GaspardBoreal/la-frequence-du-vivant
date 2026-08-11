# Import éclair — coller une recherche IA, enrôler en un geste

Objectif : coller le texte brut d'une réponse IA (avec SIRET/SIREN en vrac, espaces, texte autour), et en trois secondes obtenir les entreprises importées dans l'annuaire **et** rattachées à la campagne choisie.

## Le geste, vu par l'utilisateur

1. Bouton **« Coller une liste »** (icône presse-papiers) visible à deux endroits : en tête de l'Annuaire, et dans l'onglet **Recruter** d'une campagne.
2. Une fenêtre s'ouvre avec une grande zone de texte. On colle le texte tel quel (aucun formatage demandé). Un bouton « Coller depuis le presse-papiers » remplit la zone d'un clic.
3. **Reconnaissance immédiate** : pendant la frappe, les numéros à 14 chiffres (SIRET) et à 9 chiffres (SIREN) sont surlignés et comptés — « 5 établissements reconnus ». Les doublons et les faux positifs (dates, téléphones) sont écartés.
4. **Aperçu vivant** : chaque numéro devient une carte qui se remplit toute seule depuis l'annuaire officiel (dénomination, ville, activité, effectif), avec trois états lisibles :
   - *Nouveau* — sera créé,
   - *Déjà dans l'annuaire* — sera réutilisé (pas de doublon, pas d'écrasement de son stade),
   - *Introuvable* — signalé, on peut le corriger à la main ou l'ignorer.
   On peut décocher une ligne.
5. **Destination** : un sélecteur de campagne en bas (pré-rempli avec la campagne en cours si on vient de « Recruter »), plus deux interrupteurs :
   - « Créer aussi une opportunité pour chaque prospect » (statut initial au choix, par défaut *À contacter*),
   - « M'attribuer ces prospects ».
6. **Un seul bouton** : « Importer et enrôler (5) ». Progression ligne par ligne, puis récapitulatif : *5 importées · 5 enrôlées · 0 échec*, avec raccourci « Ouvrir la campagne » / « Démarrer la salle d'appels ».

Détail wahou, discret et utile : le bloc de texte collé est conservé en note d'origine sur chaque société importée (« issue d'une recherche IA du 11/08/2026 »), pour garder la traçabilité de la source.

## Cas particuliers gérés

- SIRET → on garde le SIREN pour la fiche société, et on mémorise le SIRET de l'établissement cité (utile pour Martell, cité à Paris avec un établissement en Charente).
- Numéros écrits avec des espaces (`433 584 117 00025`) : nettoyés automatiquement.
- Société déjà membre de la campagne : ignorée sans erreur.
- Entreprise cessée : importée mais marquée visuellement, comme dans la recherche actuelle.

## Détails techniques

- Nouveau composant `src/components/crm/PasteImportDialog.tsx` : zone de texte, extraction par expression régulière (`\b\d{9}\b` et `\b\d{14}\b` après retrait des séparateurs), déduplication par SIREN, table d'aperçu.
- Résolution de l'aperçu : réutilisation de l'edge function existante `search-french-companies` (requête par SIREN, par lots) — aucune nouvelle fonction pour la prévisualisation.
- Import : réutilisation de `useImportCompanies` → `import-companies-batch` (upsert sur `siren`, géocodage BAN déjà en place, ne réécrit pas `lifecycle_stage`).
- Enrôlement : réutilisation de `enrollCompanies` de `useCampaignMemberMutations` (`src/hooks/useCrmCampaigns.ts`) sur les identifiants renvoyés par l'import.
- Création d'opportunités optionnelle : insertion dans `crm_opportunities` puis liaison `crm_opportunity_companies`, et renseignement de `opportunity_id` sur le membre de campagne — le déclencheur de synchronisation campagne/opportunité existant fait le reste.
- Points d'entrée : bouton dans la barre d'outils de `src/pages/CrmAnnuaire.tsx` et dans `src/components/crm/campaigns/CampaignRecruit.tsx` (campagne pré-sélectionnée, sélecteur verrouillé).
- Aucune migration de base nécessaire ; le SIRET d'établissement cité est stocké dans les `tags`/`raw_payload` déjà existants si aucun champ dédié n'est libre.

## Vérification

Coller le texte de l'exemple (Territoires Charente, EPFNA, Hennessy, Martell, Rémy Martin) : 5 lignes reconnues, aperçu renseigné, import puis enrôlement dans la campagne FONCIERES/LOGISTIQUE, et contrôle qu'un second collage identique ne crée aucun doublon.
