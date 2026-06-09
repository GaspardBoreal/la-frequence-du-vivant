## Objectif

Créer une page publique unique, immersive et persuasive `/interreg-sudoe-mdv` destinée à convaincre le collectif Interreg SUDOE (programme AGROBOTICS-DITWINS) de signer avec Les Marches du Vivant. Ambiance **Forêt Émeraude immersive** (dark glassmorphism, vert émeraude + or), spectrogramme animé en hero, indexable SEO.

## Structure narrative (scroll story)

1. **Hero plein écran** — Spectrogramme bioacoustique animé en fond (Canvas / barres sinusoïdales animées), titre "Écouter le vivant pour cultiver demain", sous-titre AGROBOTICS-DITWINS · Interreg SUDOE, CTA "Prendre rendez-vous" + "Télécharger l'argumentaire PDF".

2. **Contexte** — "Pourquoi Les Marches du Vivant fait sens pour l'agriculture aujourd'hui". Bloc éditorial sur la double transformation.

3. **3 différenciateurs** — Cards glassmorphism animées au scroll : Bioacoustique low-cost / IA frugale souveraine / Science participative & poésie.

4. **Simulation A — Terrain de Deviat** — Section avec 3 scénarios (A1 Observatoire / A2 Marche Diagnostic / A3 Formation immersive) en cards verticales empilées avec icônes, livrables, alignement AGROBOTICS-DITWINS.

5. **Simulation B — Partenaires** — 3 sous-sections distinctes avec accents visuels :
   - **B1 Mairie de Deviat** (vert prairie) — scénarios B1a + B1b
   - **B2 Château Cheval Blanc** (or premium) — scénarios B2a + B2b
   - **B3 Château d'Yquem** (or doré profond) — scénarios B3a + B3b

6. **Matrice de comparaison** — Tableau dense, animé au scroll, lignes alternées, étoiles dorées pour Impact/Valeur, badges colorés pour Effort.

7. **Séquençage recommandé** — Timeline horizontale 2026 → 2027 avec 3 jalons.

8. **Convergences AGROBOTICS-DITWINS** — Tableau 2 colonnes (Axe / Apport MDV).

9. **L'IA frugale comme argument** — Bloc de clôture avec 3 piliers (Coût / Connectivité / Souveraineté) et phrase choc "John Deere, Trimble, Ag Leader ne peuvent pas tenir cet argument. Vous si."

10. **CTA final** — "Signons ensemble" : 2 boutons (Prendre rendez-vous, Télécharger PDF) + mention "Document juin 2026 · La Fréquence du Vivant · Deviat (Charente)".

## Direction visuelle (verrouillée)

- **Palette** : `#0a1f1a` (fond profond), `#0d6b58` (émeraude), `#1a4a3a` (mid), `#c9a84c` (or accent)
- **Typo** : héritée du projet (Forêt Émeraude existant)
- **Glassmorphism** : `bg-white/5 backdrop-blur-md border-white/10`
- **Animations** : `animate-fade-in` au scroll (IntersectionObserver), `hover-scale` sur cards, spectrogramme Canvas animé en boucle
- **Mention textuelle** : "Dans le cadre du programme AGROBOTICS-DITWINS — Interreg SUDOE" (pas de logo)

## Implémentation technique

- **Nouvelle page** : `src/pages/InterregSudoeMdv.tsx` (composant unique, contenu en dur)
- **Sous-composants locaux** (dans le même fichier ou `src/components/interreg/`) :
  - `HeroSpectrogramme.tsx` — Canvas 2D animation barres bioacoustiques en boucle
  - `ScenarioCard.tsx` — Card glassmorphism réutilisable
  - `MatriceComparaison.tsx` — Tableau avec étoiles
  - `TimelineSequencage.tsx` — Timeline horizontale
- **Route** : ajouter `<Route path="/interreg-sudoe-mdv" element={<InterregSudoeMdv />} />` dans `src/App.tsx`
- **SEO** : `<Helmet>` avec title "Les Marches du Vivant × AGROBOTICS-DITWINS · Interreg SUDOE", description, canonical `https://la-frequence-du-vivant.com/interreg-sudoe-mdv`, og:type article, JSON-LD Article
- **CTA "Prendre rendez-vous"** : lien vers `/agent-ia#contact` ou `mailto:` (à confirmer si besoin, sinon `mailto:contact@la-frequence-du-vivant.com`)
- **CTA "Télécharger l'argumentaire PDF"** : pour cette V1, bouton désactivé avec label "Bientôt disponible" OU export `window.print()` avec styles `@media print` (à trancher en build — par défaut je pars sur `window.print()` qui marche immédiatement)
- **Aucune modif backend / DB / RLS** — page 100 % statique, contenu en dur

## Hors scope

- Pas de génération PDF côté serveur (V1 utilise `window.print()`)
- Pas de carte interactive (non sélectionné)
- Pas de matrice filtrable (non sélectionné)
- Pas de formulaire de contact (renvoie vers `/agent-ia` existant)
