## Recommandation : 100 % Supabase (pas de requête live vers gogocarto)

Toutes les infos riches affichées par cartesolvivant.gogocarto.fr sont **déjà présentes** dans notre table `carte_sol_vivant_points`, colonne `raw` (JSONB). Vérifié sur un point :

- `nom_prenom`, `telephone`, `email`, `site_web`
- `address.streetAddress`
- `description_ferme`
- `annee_installation`, `nombre_annees_sol_vivant`
- `commercialisation`, `types_cultures`, `types_elevages`, `couverts_vegetaux`, `type_mulchs`, `types_engrais`, `agroforesterie`
- `categoriesFull` (avec libellés + id)
- `images[]`, `sourceKey`, `status`

### Pourquoi PAS de fetch live vers gogocarto ?

| Critère | Live gogocarto | Supabase (raw) |
|---|---|---|
| CORS | ❌ bloqué navigateur → il faudrait un edge function proxy | ✅ direct |
| Latence | 300–1500 ms + spinner | Instantané |
| Dispo | Dépend du site tiers (rate-limit, panne) | 100 % sous notre contrôle |
| Offline / cache | Non | Oui (React Query) |
| Coût | Requête HTTP + fonction edge par clic | Zéro |
| Données | Identiques à ce qu'on a déjà (sync quotidien) | Identiques |
| Attribution / lien source | À garder | À garder (bouton "Voir sur GoGoCarto") |

Le sync quotidien via `sync-carte-sol-vivant` garde `raw` à jour ; c'est amplement suffisant pour un annuaire de partenaires (données très stables).

## Mise en œuvre

### 1. Nouveau composant `SolVivantPointSheet.tsx`
`src/components/carte-mdv/SolVivantPointSheet.tsx` — utilise `<Sheet side="right">` (shadcn, déjà utilisé ailleurs comme `CompanyDetailSheet`). Contenu :

- **En-tête** : bandeau couleur catégorie principale + nom + fermer
- **Adresse** : `raw.address.streetAddress` + bouton "Itinéraire" (lien Google Maps `?q=lat,lng`)
- **Contact** : nom_prenom, téléphone (tel:), email (mailto:), site web (target=_blank)
- **Catégories** : chips depuis `raw.categoriesFull[]`
- **Proposition** : sous-bloc si `raw.propose_*` (accueil stagiaire, bénévole…) — extrait des clés `propose_*`/`accueil_*` du raw
- **Ferme** :
  - Année d'installation, années en Sol Vivant
  - Description (`description_ferme`)
  - Commercialisation, labellisation
  - Types cultures / élevages / couverts / mulchs / engrais / agroforesterie
- **Images** : galerie compacte si `raw.images[]` (préfixe URL gogocarto `https://cartesolvivant.gogocarto.fr/uploads/gogocarto/images/`)
- **Pied** : badges `Source : GoGoCarto Sol Vivant` + `MàJ le {synced_at}` + bouton **"Voir la fiche originale ↗"** vers l'URL gogocarto slugifiée

### 2. Ouverture depuis la carte
Dans `MapView.tsx` (fichier existant), sur chaque `CircleMarker` Sol Vivant :
- Retirer le `<Popup>` actuel (ou le garder minimaliste)
- Ajouter `eventHandlers={{ click: () => setSelectedSvId(point.id) }}`
- Monter `<SolVivantPointSheet pointId={selectedSvId} onOpenChange={...} />` au niveau du composant

Optionnel : sync avec URL comme `PipelineMapView` (`?sv=<id>`) pour partage / deep-link.

### 3. Hook data
`useSolVivantPointDetail(id)` — récupère `raw` + colonnes typées via `.select('*').eq('id', id).maybeSingle()`, staleTime 30 min. Réutilise la même table que `useSolVivantPoints`.

### 4. Utilitaires
`src/lib/solVivantRaw.ts` — helpers typés :
- `getSvImages(raw)` → URLs absolues
- `getSvContact(raw)` → { name, phone, email, website }
- `getSvFarm(raw)` → champs agro normalisés (whitelist des clés utiles + label FR)
- `getSvExternalUrl(raw)` → construit `https://cartesolvivant.gogocarto.fr/map#/fiche/{slug}/{sourceKey}/@lat,lng,15z`

## Fichiers touchés

- **Créés** : `src/components/carte-mdv/SolVivantPointSheet.tsx`, `src/lib/solVivantRaw.ts`, hook dans `src/hooks/useCarteMdV.ts`
- **Modifiés** : `src/components/carte-mdv/views/MapView.tsx` (handler clic + montage du Sheet)

Aucun backend, aucune migration, aucune fonction edge.

## Point d'attention

Si un jour on veut des données plus fraîches ou des champs non stockés (avis, agenda partenaire…), on ajoutera une edge function proxy `sol-vivant-fiche` qui appelle `/api/elements/{external_id}` côté serveur (CORS OK) et cache 24 h. Mais ce n'est **pas nécessaire aujourd'hui** — le `raw` couvre 100 % de la fiche gogocarto.
