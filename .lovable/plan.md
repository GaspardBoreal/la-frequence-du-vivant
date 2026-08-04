# Page partenaire : deux lectures d'un même audit

## Ce qu'on ajoute

En haut de `/partenaires/:slug` (et dans le panneau CRM), un sélecteur à deux positions, collé sous l'en-tête :

```text
[ Version synthétique ]   [ Version détaillée ]
```

- **Version détaillée** — exactement la page actuelle (Markdown intégral, tableaux Semrush, impression PDF inchangée).
- **Version synthétique** — nouvelle lecture, par défaut à l'ouverture : une page-affiche de négociation, faite pour être lue en 90 secondes debout, en réunion.

Le choix est mémorisé dans l'URL (`?vue=synthese` / `?vue=detail`) pour qu'un lien partagé ouvre la bonne version.

## La version synthétique — mise en scène

Une suite de « planches » plein écran qui s'enchaînent au scroll, chacune avec une idée unique et une révélation animée :

1. **Ouverture co-brandée** — « La Fréquence du Vivant × Vienne Nature », phrase-verdict d'une ligne, dégradé vivant en fond, deux logos/monogrammes face à face avec le `×` qui pulse doucement.
2. **Le duel en chiffres** — 4 à 6 KPI en vis-à-vis (LUI / NOUS) : autorité, mots-clés, trafic estimé, CTR, domaines référents. Compteurs qui s'incrémentent à l'entrée à l'écran, barres comparatives qui se remplissent. Chaque écart est annoté d'une phrase courte (« autorité forte, trafic non qualifié »).
3. **La complémentarité** — un diagramme en deux cercles qui se recouvrent : ce que le partenaire apporte (audience, autorité, réseau institutionnel), ce que nous apportons (intention d'action, lisibilité machine, terrain mesuré), et au centre la zone commune.
4. **La preuve terrain** — KPI extraits de la plateforme : marches réalisées, marcheurs, observations du vivant, espèces distinctes, communes couvertes. Chiffres réels lus depuis la base, jamais inventés ; si une valeur est indisponible elle est simplement masquée.
5. **Le levier IA / GEO** — pourquoi nos pages sont lisibles par ChatGPT, Perplexity, Claude, Gemini (`llms.txt`, données structurées) et pourquoi le partenaire ne l'est pas encore. Visuel de « faisceau » balayant.
6. **Les trois leviers du partenariat** — trois cartes tenues côte à côte : maillage croisé, marches co-organisées, caution scientifique pour les offres entreprises. Chacune avec le gain pour chaque partie.
7. **La clôture** — la proposition en une phrase, la date, et le rappel de confidentialité.

Détails d'exécution : animations d'entrée au scroll, respect de `prefers-reduced-motion`, palette et typographie du site (aucune couleur en dur), lecture confortable sur mobile (planches empilées, KPI en deux colonnes).

## Impression

La version synthétique a sa propre maquette d'impression : une planche de garde + deux pages KPI/leviers, pour un « executive summary » que l'on peut laisser sur la table. L'impression de la version détaillée reste telle quelle.

## Détails techniques

- `src/pages/PartenaireAudit.tsx` : ajout de l'état de vue (param d'URL `vue`), du sélecteur, et du rendu conditionnel. Le mur de mot de passe et le `noindex` sont inchangés.
- `src/components/partners/PartnerAuditViewSwitcher.tsx` : segmenté à deux options (même esprit que `ViewSwitcher` de la carte).
- `src/components/partners/synthese/` : `PartnerAuditSynthesis.tsx` (orchestrateur des planches) + un composant par planche (`DuelKpi`, `ComplementarityVenn`, `PlatformProof`, `GeoBeam`, `LeviersCards`), plus un hook `useRevealOnScroll` (IntersectionObserver) et `useCountUp`.
- `src/lib/partnerAudits/types.ts` : le type `PartnerAudit` gagne un champ optionnel `synthesis` (verdict, tableau de KPI comparés, leviers, phrase de clôture). Les audits sans ce champ n'affichent que la version détaillée — le sélecteur est alors masqué.
- `src/lib/partnerAudits/vienneNature.ts` : renseigne `synthesis` avec les chiffres déjà présents dans l'audit livré (Semrush, GSC), sans en inventer de nouveaux.
- KPI plateforme : réutilisation des statistiques publiques déjà exposées par le projet (source unique existante des stats globales), en lecture seule, avec squelettes de chargement.
- `src/components/crm/opportunities/PartnerAuditDrawer.tsx` : même sélecteur, pour prévisualiser la synthèse depuis le CRM.
- `src/index.css` : bloc d'impression `partner-audit-print-mode` étendu d'une variante « synthèse ».

## Hors périmètre

Génération IA de la synthèse (v2), et toute création de chiffre non issu de la plateforme ou de l'audit existant.
