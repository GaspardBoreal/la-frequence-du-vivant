# Plan B révisé — Reconnaissance IA via Pl@ntNet (flore) + Gemini (faune)

## Pourquoi cette combinaison

| Règne | Provider | Justification |
|---|---|---|
| **Plantes** (🌿 ~70 % des photos attendues) | **Pl@ntNet** | Référence scientifique FR, entraîné sur flore EU, 500 req/jour gratuit, noms FR natifs |
| **Faune / champignons / autres** | **Lovable AI (Gemini Vision)** | Pas d'API gratuite faune équivalente, Gemini sait dire « je ne sais pas » |
| **Routing** | Gemini en pré-tri (« est-ce une plante ? ») | 1 appel léger → dispatch vers le bon expert |

À terme (fin juillet 2026), on ajoute iNat comme 3ᵉ provider sans rien casser.

## Étape 0 — Secret Pl@ntNet (maintenant, 30 s)

Je vais te demander d'ajouter le secret `PLANTNET_API_KEY` via le formulaire sécurisé Lovable. Ne colle jamais la clé dans le chat ; le formulaire est chiffré.

Doc Pl@ntNet utilisée : `POST https://my-api.plantnet.org/v2/identify/{project}` avec `api-key` en query string, `images[]` + `organs[]` en multipart. Projet par défaut : `all` (couvre la flore mondiale). Pour la France métropolitaine on prendra `weurope` (West Europe) — meilleurs scores.

## Étape 1 — Schéma DB (1 migration)

```text
marcheur_photo_ai_suggestions
  id, media_id, rank (1..5), 
  taxon_scientific_name, taxon_common_name_fr, kingdom,
  confidence (0..1),
  ai_provider ('plantnet' | 'gemini' | 'inat'),
  raw_response jsonb,
  created_at

marcheur_medias
  + ai_status enum ('pending' | 'processing' | 'auto_validated' 
                    | 'pending_curation' | 'low_confidence' 
                    | 'unidentifiable' | 'validated_by_human')
  + ai_kingdom_hint text  (rempli par Gemini pré-tri)

marche_events
  + ai_recognition_config jsonb 
    default { auto: 0.85, curation: 0.60, 
              providers: { plant: 'plantnet', fauna: 'gemini' },
              plantnet_project: 'weurope' }
```

RLS : lecture admin/ambassadeur, écriture service_role uniquement.

## Étape 2 — Edge function `recognize-marcheur-photos`

Pipeline par photo :

```text
1. Charger photo + EXIF GPS depuis marcheur_medias.metadata
2. [Pré-tri Gemini] 1 appel court : "Cette photo est-elle 
   principalement (a) plante/fleur/arbre, (b) animal/insecte/oiseau, 
   (c) champignon, (d) paysage/inidentifiable ?"
   → stocké dans ai_kingdom_hint
3. Routing :
   ├─ (a) plante → Pl@ntNet /v2/identify/weurope
   │     organs=['auto'], lat/lng en query
   │     → top 5 results (score, species.scientificNameWithoutAuthor,
   │        commonNames[fr])
   │
   ├─ (b)(c) → Gemini Vision structured output
   │     prompt FR + schéma JSON strict (5 suggestions)
   │
   └─ (d) → ai_status='unidentifiable', skip
4. Insertion des 5 suggestions dans marcheur_photo_ai_suggestions
5. Routing par seuil sur top1 :
   ≥ 0.85  → auto_validated → INSERT marcheur_observations 
            (re-déclenche les snapshots existants)
   0.60-85 → pending_curation
   < 0.60  → low_confidence
```

Modes : `POST { eventId }` (batch) ou `POST { mediaId }` (relance unitaire). Auth admin via `has_role`.

## Étape 3 — UI admin « Reconnaissance IA »

Nouvel onglet dans la fiche du `Laboratoire à Ciel Ouvert` :

- **Header** : compteurs (81 total · X auto · Y à curer · Z faible · W non identifiables) + bouton « Lancer la reconnaissance »
- **Réglages repliés** : sliders seuils, sélecteur provider plantes (`Pl@ntNet` actif, `iNaturalist (juillet)` grisé), projet Pl@ntNet (`weurope` / `all`)
- **Progress bar** temps réel + ETA
- **Drawer de curation** :
  - Carrousel photos `pending_curation` triées par confiance descendante
  - Header : nom de fichier, GPS sur mini-RichMap, date EXIF, badge provider
  - 5 suggestions cliquables (vignette iNat/GBIF si dispo + nom FR + score)
  - Actions : ✅ Valider top1 · 🔄 Choisir autre · ✏️ Saisir manuellement · ❌ Non identifiable
  - La validation crée immédiatement `marcheur_observations` → snapshot refresh

## Étape 4 — Validation sur les 81 photos de Vincent

1. Migration + déploiement edge function
2. Bouton « Lancer (81 photos) » → ~3-4 min (rate-limit Pl@ntNet courtois à 1 req/s)
3. Vérification : taux auto ≈ 50-70 %, curation rapide du reste (15-20 min)
4. Contrôle de cohérence : les espèces apparaissent dans la Synthèse + Carte de l'event

## Quotas et coûts

- **Pl@ntNet** : 500 identifs/jour gratuit → 81 photos = 16 % du quota, large marge
- **Lovable AI Gemini** : pré-tri (~81 appels légers) + faune (~25 % des photos) ≈ négligeable
- Si quota Pl@ntNet dépassé un jour : fallback automatique sur Gemini pour les plantes restantes

## Question avant build

OK pour : (a) j'ouvre maintenant le formulaire secret `PLANTNET_API_KEY` puis (b) j'enchaîne Étapes 1+2+3 d'un trait ?
