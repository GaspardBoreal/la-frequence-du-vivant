## Objectif

Réduire le poids du premier chargement de l'application sans modifier **aucune** fonctionnalité, aucun design, aucun texte. Aujourd'hui un visiteur télécharge la totalité de l'app (29 Mo, 5,5 Mo compressé) avant de voir la première page — y compris l'administration, les exports Word/Excel/PDF, les cartes, la conversion de photos iPhone et l'éditeur de scénographie qu'il n'ouvrira jamais.

Cible : **premier chargement < 1,5 Mo compressé** (contre 5,5 Mo), le reste arrivant à la demande.

## Constat mesuré

- `src/App.tsx` importe **95 pages en dur** (lignes 2-112) et rend ~90 routes. Aucun `React.lazy` dans tout le projet.
- `vite.config.ts` n'a **aucune configuration `build`** : Rollup n'a donc aucune consigne de découpage et met tout dans un seul fichier.
- Grosses librairies chargées systématiquement, même sans être utilisées :
  - `@babel/standalone` (~2-3 Mo) dans `ScenographyRuntime.tsx:2` — utilisé uniquement pour les scénographies sur-mesure.
  - `docx` dans 5 utilitaires d'export (`wordExportUtils.ts:12`, `eventExportUtils.ts:14`, `editorExportUtils.ts:19`, `marchesStatsExport.ts:15`, `vocabularyWordExport.ts:10`).
  - `xlsx` (`eventExportUtils.ts:16`), `jszip` (`InatUploadPrepDrawer.tsx:2`), `jspdf` (`TabSynthesize.tsx:3`, `exportClassificationReport.ts:2`), `qrcode` (4 fichiers).
  - `leaflet` + `react-leaflet` dans ~35 fichiers, plus le CSS Leaflet chargé dès l'entrée (`main.tsx:6`).
  - `recharts` dans 19 fichiers, `framer-motion` dans 367 fichiers.
- Déjà bien fait et à répliquer : `heic-to`/`heic2any` sont chargés à la demande (`heicConverter.ts:83,89`) — d'où leurs fichiers séparés dans le build.

## Ce qui va être fait

### Phase 1 — Découpage des routes (le gain principal)

Transformer les 95 imports de pages de `App.tsx` en chargement à la demande (`React.lazy`), avec un `<Suspense>` global affichant un écran d'attente soigné aux couleurs du site (pas un spinner générique) : logo/monogramme, fond crème ou forêt selon le thème actif, transition douce.

Les 5-6 pages d'entrée les plus visitées restent en chargement immédiat pour éviter tout clignotement : `Index`, `MarchesDuVivant`, `CarteMarchesDuVivant`, `PublicEventPage`, `Auth`. Tout le reste (administration, CRM, Opus, exports, Dordonia, propriété/diagnostic, livre vivant…) arrive au clic.

Effet attendu : l'admin (~40 % du code) et les modules experts disparaissent du premier chargement.

### Phase 2 — Librairies lourdes à la demande

Aucune suppression de fonctionnalité : on déplace simplement l'import à l'intérieur de la fonction qui l'utilise.

| Librairie | Traitement |
|---|---|
| `@babel/standalone` | chargé au montage de `ScenographyRuntime` uniquement |
| `docx`, `xlsx`, `jszip`, `jspdf` | chargés dans le gestionnaire de clic « Exporter » / « Imprimer » |
| `qrcode` | chargé au moment de la génération du QR |
| `dompurify` | usage unifié (aujourd'hui statique dans `htmlSanitizer.ts`, dynamique ailleurs) |

Les boutons concernés gagnent un état « préparation… » pendant le chargement (< 1 s), déjà présent sur certains.

### Phase 3 — Chunks nommés

Ajouter `build.rollupOptions.output.manualChunks` dans `vite.config.ts` pour regrouper proprement : `react-vendor`, `maps` (Leaflet + plugins), `charts` (Recharts), `motion` (framer-motion), `supabase`, `ui` (Radix/shadcn). Résultat : des fichiers mis en cache par le navigateur qui ne sont pas re-téléchargés à chaque publication, et un CSS Leaflet chargé avec les cartes plutôt qu'à l'entrée.

### Phase 4 — Vérification

- Build de production : relevé du poids de chaque chunk avant/après, comparé au relevé actuel (index = 29 143 kB).
- Parcours Playwright des routes clés (accueil, carte, `/m/:slug`, mon-espace, admin, `/propriete/...`) : capture d'écran + zéro erreur console, pour prouver qu'aucun écran ne casse.
- Test des 4 exports (Word, Excel, PDF, ZIP iNat) et d'une scénographie sur-mesure.
- Le heap Node à 8 Go reste en place par sécurité, mais ne devrait plus être nécessaire.

## Détails techniques

- `React.lazy` + `Suspense` par route ; les routes imbriquées (`ExplorationLayout` lignes 170-185, `CrmShell` 263-271) gardent leur layout en chargement immédiat et ne rendent lazy que les enfants, pour éviter un flash du gabarit.
- Les imports dynamiques utilisent `await import()` dans le corps des fonctions ; les modules d'export (`src/utils/*ExportUtils.ts`) restent des modules statiques, seul l'import de la librairie tierce devient dynamique — les signatures publiques ne changent pas.
- `framer-motion` est trop diffus (367 fichiers) pour être rendu dynamique : il est isolé en chunk vendor partagé, ce qui suffit (il est chargé une fois et mis en cache).
- Non concernés : `three` et `mapbox-gl` ne sont pas utilisés ; `html2canvas` arrive comme dépendance de `jspdf` et suivra son découpage.

## Ce qui ne change pas

Aucune interface, aucun libellé, aucun comportement métier, aucune requête base de données, aucun style. Seul ajout visible : un écran d'attente très bref et graphiquement intégré lors du premier accès à une section lourde.
