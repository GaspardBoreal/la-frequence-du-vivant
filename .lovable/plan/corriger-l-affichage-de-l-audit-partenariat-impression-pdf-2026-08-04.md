# Corriger l'affichage de l'audit partenariat + impression PDF

## Ce qui ne va pas (constaté dans le code)

1. **Le panneau est transparent et écrasé.** `PartnerAuditDrawer` utilise `bg-background/98` — cette valeur d'opacité n'existe pas dans l'échelle Tailwind du projet, la classe est ignorée : le fond reste transparent, d'où la superposition illisible avec le formulaire « Modifier l'opportunité » derrière.
2. **Le panneau est enfermé dans la modale.** Il est rendu à l'intérieur du contenu Radix Dialog, qui crée un contexte d'empilement (transform) : le `fixed inset-0` se cale sur la boîte de la modale, pas sur l'écran — d'où la colonne étroite, le titre tronqué (« La Fréquence… ») et l'en-tête compressé.
3. **L'impression sort toute l'application.** Le bouton « Imprimer » appelle `window.print()` sans feuille d'impression dédiée : l'app entière est envoyée à l'imprimante. Le projet dispose déjà d'un motif éprouvé (portail d'impression A4 + `body.<mode>-print-mode`) utilisé pour « J'analyse » et la convivialité — on le réutilise.

## Ce qu'on fait

### A. Affichage dans l'application

- Rendre le panneau via un portail sur `document.body`, donc plein écran réel quelle que soit la modale ouverte.
- Fond **opaque** (surface papier/sombre selon le thème), en-tête sur deux niveaux qui ne tronque plus le titre : ligne 1 « Jalon 2 · Audit partenariat » + actions à droite, ligne 2 titre complet « La Fréquence du Vivant × Vienne Nature » + sous-titre et date.
- Barre d'actions collante, corps scrollable, largeur de lecture confortable (max ~78 caractères), typographie éditoriale renforcée (titres de sections numérotés, tableaux zébrés avec en-tête figé).
- Bloc « page web partenaire » (URL + mot de passe) transformé en encart discret avec bouton « Copier le lien ».
- Verrouiller le scroll du corps de page pendant l'ouverture, fermeture Échap conservée.

### B. Impression PDF remarquable

Nouveau layout d'impression A4 dédié, partagé par le panneau CRM et la page publique `/partenaires/:slug` :

- Page de garde : bandeau co-brandé « La Fréquence du Vivant × Partenaire », titre de l'audit, date, mention « Document de négociation — diffusion restreinte », sources.
- Corps : pagination A4 propre, filets et titres de section dans la teinte de marque, tableaux Semrush lisibles (têtes répétées entre pages, pas de ligne coupée), listes à puces conservées.
- Pied de page sur chaque page : nom du partenaire + numérotation.
- Impression sur fond papier clair avec `print-color-adjust: exact`, quel que soit le thème d'écran.

## Détails techniques

- `src/components/crm/opportunities/PartnerAuditDrawer.tsx` : `createPortal` vers `document.body`, `bg-background` opaque, en-tête restructuré, `overflow:hidden` sur `body` pendant l'ouverture.
- `src/components/partners/PartnerAuditPrintLayout.tsx` (nouveau) : rendu A4 du Markdown de l'audit (réutilise `PartnerAuditContent` avec une variante `print`), monté dans un portail `#partner-audit-print-portal`.
- `src/index.css` : bloc `@media print` `body.partner-audit-print-mode` sur le modèle existant de `analyze-print-mode` (masque tout sauf le portail, classe `.partner-audit-page` en 210×297 mm, en-tête/pied, règles `thead { display: table-header-group }`, `tr { break-inside: avoid }`).
- `src/components/partners/PartnerAuditContent.tsx` : prop `variant` pour les styles d'impression (encre sombre sur papier, tailles en pt).
- `src/pages/PartenaireAudit.tsx` : le bouton « Imprimer / PDF » passe par le même portail, la page écran reste inchangée.

Aucune modification de données ni de route.
