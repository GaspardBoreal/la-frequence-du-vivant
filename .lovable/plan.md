
## Objectif

Construire une page dédiée **`/marches-du-vivant/agriculture`** qui transforme les constats du dashboard RSO CUMA Nouvelle-Aquitaine (Chapitre 5 — Respect du Vivant, score moyen 41,5 %) en **proposition d'action concrète** : organiser une Marche du Vivant sur ses parcelles pour passer du discours à la mesure terrain.

Cible : Coopératives, CUMA, Fédérations (FRCUMA / Chambres d'agriculture), exploitants individuels engagés ou en transition.

Mettre à jour le lien de la vignette "Pour les Acteurs Agricoles" (actuellement vers `/marches-du-vivant/entreprises`) pour pointer vers cette nouvelle page.

## Architecture de la page

Reprise du gabarit visuel de `MarchesDuVivantEntreprises.tsx` (header retour, Hero, sections rythmées, TrustBar, ContactFormB2B, Footer) — palette **lime / emerald** pour ancrer le territoire agricole, sans casser la cohérence du design system.

### 1. Hero — "Du référentiel RSO au terrain vivant"

- Badge : "Coopératives · CUMA · Fédérations · Exploitants"
- H1 : *"Pour les Acteurs Agricoles"* — accent lime sur "Acteurs Agricoles"
- Sous-titre : *"Le Chapitre 5 du référentiel RSO CUMA Nouvelle-Aquitaine — Respect du Vivant — reste le plus grand chantier collectif. Les Marches du Vivant transforment ce chantier en expérience concrète sur vos parcelles."*
- 2 CTA : "Organiser une marche agricole" (scroll contact) + "Voir un éductour"

### 2. ProofBar chiffrée (issue du dashboard)

Bandeau 4 chiffres-clés repris du Chapitre 5 (source RSO CUMA Nouvelle-Aquitaine, 254 CUMA évaluées) :
- **41,5 %** — score moyen Chapitre 5 « Respect du Vivant »
- **1 / 254** — une seule CUMA à 100 % sur la Biodiversité (C5.3)
- **157 CUMA** entre 20 et 40 % sur la biodiversité
- **+15 à +25 pts** — gain global possible si Ch.5 progresse de 5 pts

### 3. Section "5 leviers que votre marche active"

Grille 5 cartes (icônes Lucide, palette lime/emerald/amber). Chaque carte = un enjeu issu du dashboard, traduit en livrable concret de la marche :

| Levier (issue dashboard) | Ce que la marche apporte | Icône |
|---|---|---|
| Services rendus par la biodiversité | Inventaire vivant sur site (pollinisateurs, auxiliaires, sols, sons) avec restitution GBIF | `Sprout` |
| Réglementation haies & bocage | Diagnostic du linéaire bocager + temps d'information réglementaire sur la taille / l'entretien | `Trees` |
| Atelier collectif "Services de la biodiversité" | Format 3 h : marche d'observation + atelier de cartographie des services (pollinisation, régulation ravageurs, qualité des sols) | `Users` |
| Pratiques culturales alternatives | Restitution comparée : agroforesterie, bandes enherbées, couverts végétaux, matériel bas-intrants | `Wheat` |
| Benchmark des leaders | Visites organisées chez les CUMA exemples (Anémone 50/50, Couzeau, DES LANDES) — repris du dashboard | `Trophy` |

### 4. Section "3 formats pour 3 publics agricoles"

3 cartes (FormationCard réutilisable ou variante locale) :

- **Format Coopérative / CUMA** — 1 journée, animation collective d'adhérents, livrable : diagnostic Ch.5 RSO opposable.
- **Format Fédération / Chambre** — programme régional, plusieurs marches en réseau, livrable : benchmark inter-territoires + restitution publique.
- **Format Exploitant** — 1/2 journée sur une exploitation, livrable : carte des services écosystémiques + plan d'action personnalisé.

### 5. Encart "La preuve par l'exemple — les leaders"

Repris du dashboard (champions C5.3 / Ch.5) : 3 vignettes — Anémone (50/50 pts biodiversité), Couzeau (82,1 % Ch.5), DES LANDES — présentées comme inspiration de visite-benchmark. Mention source : "RSO CUMA Nouvelle-Aquitaine".

### 6. Bandeau argument massue (style page Entreprises)

> *"Vos adhérents passent du référentiel papier à la mesure terrain : chaque marche produit une donnée biodiversité opposable, alignée avec le Chapitre 5 du RSO CUMA."*

### 7. TrustBar (réutilisée, sans Qualiopi)

### 8. Formulaire de contact

Réutilisation de `ContactFormB2B` avec `source="page-agriculture"`. Un champ "Type d'organisation" prérempli : Coopérative / CUMA / Fédération / Chambre / Exploitant.

### 9. Footer

## Mise à jour de la home `/marches-du-vivant`

Dans `src/pages/MarchesDuVivant.tsx`, la carte "Pour les Acteurs Agricoles" : remplacer `to="/marches-du-vivant/entreprises"` par `to="/marches-du-vivant/agriculture"`.

## Détails techniques

- Nouveau fichier : `src/pages/MarchesDuVivantAgriculture.tsx` (copie ergonomique du squelette `MarchesDuVivantEntreprises.tsx`).
- Nouvelle route dans `src/App.tsx` : `<Route path="/marches-du-vivant/agriculture" element={<MarchesDuVivantAgriculture />} />` à insérer dans le bloc "Routes Les Marches du Vivant".
- SEO : `<title>` "Marches du Vivant pour l'Agriculture — Coopératives, CUMA, Fédérations", meta description axée Chapitre 5 RSO CUMA + biodiversité agricole, canonical `/marches-du-vivant/agriculture`.
- Palette : tokens existants `lime-*`, `emerald-*`, `amber-*` déjà utilisés sur la home — pas de nouveau token CSS nécessaire.
- Pas de modification backend, ni de DB, ni d'edge function.
- Pas de nouveau composant lourd : on réutilise `TrustBar`, `ContactFormB2B`, `Footer`, et on inline les sections spécifiques (5 leviers, 3 formats, leaders) sous forme de cartes Motion identiques au pattern existant.

## Hors scope

- Pas de tableau de bord interactif (charts) reproduisant le dashboard — uniquement des chiffres-clés statiques en preuve sociale.
- Pas de back-office pour gérer les CUMA leaders mises en avant.
- Pas de page dédiée "agriculture/leaders/:slug" — à envisager dans une itération ultérieure si demande.

## Question ouverte

Souhaitez-vous afficher **nominativement** les CUMA leaders (Anémone, Couzeau, DES LANDES, GRASASA…) avec mention "source RSO CUMA Nouvelle-Aquitaine", ou rester sur une formulation anonyme ("les CUMA exemples de Nouvelle-Aquitaine") en attendant une autorisation formelle ?
