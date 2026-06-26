# Mini-dossier « Pack Vivant Mécène » — 4 pages

Livrable autonome au format PDF, dans la même charte que la plaquette mécènes existante (palette ivoire / vert forêt / accent doré, typo titres serif éditoriale, corps sans-serif aéré). Posé dans `/mnt/documents/pack-vivant-mecene-v1.pdf`, prêt à être annexé à la plaquette ou envoyé seul en RDV.

## Intention éditoriale

Sortir du vocabulaire « domaine / terroir » (Pack vignoble) pour parler le langage des directions RSE, COMEX et Communication : **preuve, engagement, visibilité, science**. Ton sobre, inspirant, factuel — registre mécénat haut de gamme, pas plaquette commerciale.

Fil rouge : *« Vous donnez du sens. Nous le rendons visible, mesurable et partagé. »*

## Structure des 4 pages

```text
P1  Couverture + promesse mécène
P2  Le Pack Vivant Mécène — 4 piliers
P3  Trois niveaux d'engagement (Bronze / Argent / Or)
P4  Contreparties, cadre fiscal & prochaine étape
```

### Page 1 — Couverture

- Bandeau supérieur : *La Fréquence du Vivant — Mécénat 2026*
- Titre : **« Le Pack Vivant Mécène »**
- Sous-titre : *Ce que reçoit votre entreprise quand elle soutient les Marches du Vivant.*
- Encadré promesse en 3 lignes : Preuve · Expérience · Visibilité
- Pied : *Document complémentaire à la plaquette mécènes*

### Page 2 — Le Pack Vivant Mécène, 4 piliers

Grille 2×2, chaque pilier = pictogramme + titre + 3 livrables concrets.

| Pilier | Livrables clés |
|---|---|
| **1. Preuves RSE / CSRD** | Indicateurs biodiversité certifiés GBIF · Export CSV / XLSX / GeoJSON horodaté · Fiche synthèse intégrable rapport extra-financier (ESRS E4) |
| **2. Engagement collaborateurs** | 1 à 3 Marches du Vivant avec vos équipes · Restitution live le jour même · Kit comm' interne (photos, témoignages, récit de journée) |
| **3. Visibilité & communauté** | Page mécène dédiée sur l'app · Logo sur les pages publiques des marches financées · Mention dans la newsletter nationale (communauté en croissance) |
| **4. Contribution scientifique** | Observations versées à GBIF & iNaturalist sous votre nom · Attestation de contribution science participative · Focus espèces remarquables de vos territoires |

### Page 3 — Trois niveaux d'engagement

Tableau comparatif clair, paliers indicatifs (à valider avec Victor/Laurent).

| | **Bronze — 5 000 €** | **Argent — 15 000 €** | **Or — 50 000 €** |
|---|---|---|---|
| Marches du Vivant | 1 marche (≤ 20 collab.) | 3 marches (≤ 60 collab.) | Programme annuel — jusqu'à 10 marches |
| Pack données | Export standard + fiche RSE | + rapport personnalisé PDF | + dashboard biodiversité dédié, mis à jour en continu |
| Visibilité | Logo page marche | + page mécène dédiée + post réseaux | + co-construction d'un récit territorial (film court, podcast) |
| Communauté | Mention newsletter | + intervention d'un explorateur en interne | + conférence Gaspard Boréal / Laurent Tripied |
| Science | Attestation GBIF | + focus espèces remarquables | + parrainage d'un territoire prioritaire sur 12 mois |

Note de bas de page : *« Tous les paliers sont éligibles au mécénat d'entreprise — réduction d'impôt de 60 % (art. 238 bis CGI), dans la limite de 0,5 % du CA HT. »*

### Page 4 — Contreparties, cadre & contact

- Bloc **Cadre fiscal mécénat** : rappel 60 % réduction IS, plafond, contreparties autorisées ≤ 25 % du don.
- Bloc **Ce que vous ne recevez pas** (assumé, posture mécène) : pas de prestation commerciale exclusive, pas de greenwashing — *vous soutenez une mission d'intérêt général dont vous bénéficiez en retour.*
- Bloc **Calendrier type** : signature → 1ʳᵉ marche < 90 jours → Pack Vivant sous 48 h → bilan annuel.
- CTA : *Prendre RDV avec Victor Boixeda / Laurent Tripied* + emails + QR code vers `/adhesion` (ou page mécénat dédiée).

## Production technique

- Génération via **skill DOCX** (Arial / Georgia pour rester lisible et imprimable), conversion PDF via LibreOffice.
- Palette alignée plaquette : fond ivoire `#FAF8F3`, vert forêt `#0D6B58`, accent doré `#C9A961`, texte `#1A1F1C`.
- Visuels : 2 photos réutilisées depuis la plaquette (page 1 arbre + page 5 fleurs bleues) recopiées depuis `parsed-documents://…/Plaquette_mécènes.pdf/images/`.
- QA obligatoire : conversion PDF → images de chaque page → relecture (overflow, contraste, alignement tableau paliers).

## Livrable final

- `/mnt/documents/pack-vivant-mecene-v1.pdf` (4 pages, prêt à envoyer)
- Présenté avec `<presentation-artifact>` pour téléchargement immédiat.
- Message court à Victor résumant les choix structurants (paliers indicatifs, posture mécénat assumée, 4 piliers vs offre vignoble).

Si tu approuves, je passe en build et je te livre le PDF dans la foulée. Les montants 5k / 15k / 50k sont des **propositions de cadrage** — dis-moi si tu veux les ajuster avant production ou les laisser comme base de discussion avec Victor.
