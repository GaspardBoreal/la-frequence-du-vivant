---
name: Clinique du jardin
description: Module santé du jardin dans « Mon projet » — consultations, diagnostic IA croisé sol/météo/KB, prescription du plus doux au plus fort, journal horodaté, baromètre de risque, poste d'écoute sondes
type: feature
---

Entrée **« Clinique du jardin »** dans le menu **Mon projet** de l'espace Propriété (`tab=clinique`, `TabClinique.tsx`).

## Règles métier
- **Consultation** = un sujet (espèce du pool iNaturalist ou nom libre) + organe + depuis quand + étendue 1..5 + médias. Statuts : observation / traitement / gueri / perdu.
- **Diagnostic** : edge `diagnose-garden-disease` (Lovable AI, `google/gemini-2.5-flash`, vision + tool calling). Il reçoit images (data URL), `soilLiteFromState`, `summarizeWeather` (Open-Meteo 30 j) et la KB filtrée. Chaque hypothèse porte une `terrain_reading` reliant explicitement les signes au sol et à la météo — **interdiction d'inventer des chiffres**.
- **Prescription vivante** : gestes classés par intensité 1→5 (1 = observer, 5 = intervention la plus forte encore compatible bio), volet curatif ou préventif. Jamais de produit de synthèse.
- **Baromètre du jour** (`src/lib/gardenRisk.ts`) : score 0–100 depuis humidité / pluie cumulée / température moyenne 30 j + fenêtres de vigilance du mois croisées avec les plantes réellement observées.
- **Journal de rétablissement** : médias horodatés (photo/vidéo/vocal) avec sévérité au moment de la prise, bucket privé `propriete-clinique`, chemin `<propriete_id>/<consultation_id>/…`, URL signée 1 an.
- **Poste d'écoute** : `propriete_sensor_readings` accueille température / humidité / luminosité en saisie manuelle, prêt pour les sondes (source `manuelle` | `csv` | `api`).

## Tables
`propriete_consultations`, `propriete_consultation_hypotheses`, `propriete_consultation_actions`, `propriete_consultation_medias`, `propriete_sensor_readings` (RLS via `can_access_propriete`), `garden_pathogens_kb` (lecture publique, écriture admin).
