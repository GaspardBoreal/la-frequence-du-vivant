# Page partenariat — La Fréquence du Vivant × Soil Acoustics

Une page publique bilingue (EN par défaut, bascule FR), à envoyer directement à Gavin Ward,
reprenant fidèlement les deux sections HTML fournies, avec CTA Calendly et export PDF imprimable.

## Ce que verra Gavin Ward

URL : `/partners/soil-acoustics` (avec `/partners/soil-acoustics?lang=fr` pour la version française).

Contenu porté tel quel depuis les fichiers joints, dans l'ordre existant :

1. Hero « Listening to what lives beneath our feet » — bandeau forêt sombre, éveil visuel d'écoute du sol,
   badge, liens.
2. « A living world we can barely hear » — le constat en trois cartes (vie invisible, trajectoire à prouver,
   communauté en marche).
3. « Listening to soil the way we listen to a forest » — ce que nous explorons, crédit Soil Acoustics.
4. « Three fields already ready for a new frequency » — Marches du Vivant, Fréquence Jardin, Fréquence Vignoble.
5. « An exploration, step by step » — premier contact, explorations techniques, pilote & annonce.
6. Clôture — citation du manifeste, mention technologie Soil Acoustics.

Deux ajouts par rapport aux fichiers joints :

- **Sélecteur de langue** en haut à droite, discret (EN | FR), collant au scroll sur mobile.
  EN est la langue par défaut ; le choix est mémorisé dans l'URL (`?lang=fr`) pour que le lien
  reste partageable dans la langue voulue.
- **CTA Calendly** — le formulaire e-mail statique de fin de section est remplacé par un bouton
  principal « Book a 30-minute call » / « Réserver un créneau » pointant vers
  `https://calendly.com/laurent-bziiit/entretien-ia` (nouvel onglet). Un bouton secondaire
  reprend le contact e-mail direct. Le même CTA est rappelé dans le hero.

## Export PDF imprimable

`/partners/soil-acoustics?print` (et un bouton « Download PDF / Version PDF » dans la page)
rend la même page en mise en page A4 paysage, une section par page, fonds et couleurs conservés
(`print-color-adjust: exact`). `Cmd+P → Enregistrer en PDF` produit un document façon deck,
dans la langue affichée. Pas de fichier PPTX.

## Détails techniques

- `src/pages/PartnersSoilAcoustics.tsx` : page unique, contenu FR/EN dans un objet
  `src/content/soilAcousticsPartnership.ts` (une clé par bloc, deux langues), pour éviter toute
  divergence entre versions et faciliter les retouches de texte.
- `src/styles/soil-acoustics.css` : CSS des fichiers joints repris à l'identique, scopé sous
  `.lfdv-sa` (aucune fuite vers le reste du site), plus les règles `@media print`.
  Lora + Poppins sont chargées via `<link>` conditionnel dans la page.
- Chartes : la palette du fichier joint (forêt #2D5016, mousse #9DB86D, terre #7A4E2D, ambre #D9952B)
  est exactement celle de l'offre ; les logos lock-up Marches du Vivant et Fréquence Jardin déjà
  présents dans `src/assets/brand/` sont utilisés dans le bloc « trois terrains ».
- L'animation `sa-reveal` au scroll est reprise via un `IntersectionObserver` React.
- Route déclarée dans `src/App.tsx` en `lazyWithRetry`, comme les autres pages publiques.
- SEO : `SEOHead` avec titre/description EN, `hreflang` FR/EN, canonical auto-référencé,
  `noindex` non appliqué (page publique assumée) — dites-moi si vous préférez la garder hors index.

## Vérification

- Rendu inspecté en 375 px et 1280 px, versions EN et FR.
- Bascule de langue testée avec URL partagée.
- PDF généré depuis la route d'impression, converti en images et relu page par page
  (accents, débordements, couleurs) avant livraison.
