# Humidité du sol à faible profondeur — sonde Potager d'Été

## Constat vérifié (livraisons de ce soir)

Ce n'est pas un problème d'affichage : la valeur n'arrive pas.

- **Potager d'Hiver (b26s001, « 5/30 »)** — payload 20h45 : `soilMoisture_0cm`, `soilMoisture_30cm`, `soilTemperature_0cm`, `soilTemperature_30cm` (+ un `soilMoisture` « à plat » doublon du 0 cm, écarté proprement).
- **Potager d'Été (b26s002, « 5/15 »)** — payload 20h57 : uniquement `soilMoisture_15cm` et `soilTemperature_15cm` (+ le doublon à plat). **Aucune clé de faible profondeur n'est émise.**

Deux anomalies côté Brad, pas côté nous :
1. la sonde 5/15 n'envoie pas son capteur superficiel ;
2. sur la 5/30, le capteur superficiel est étiqueté `_0cm` alors que la sonde s'appelle « 5/30 » — il devrait vraisemblablement être `_5cm`.

## Ce qu'on fait de notre côté

### 1. Rendre l'absence lisible plutôt que silencieuse
Dans le widget horaire et la fiche sonde, afficher les profondeurs **attendues** d'après le modèle de la sonde (« 5/15 » → 5 cm et 15 cm ; « 5/30 » → 5 cm et 30 cm). Une profondeur attendue sans donnée s'affiche en tuile grisée « — · non transmise », au lieu de disparaître. On voit immédiatement que la sonde d'Été est muette à faible profondeur, et les deux sondes retrouvent une grille comparable.

### 2. Normaliser l'étiquette 0 cm → 5 cm
Quand le modèle de sonde annonce une profondeur superficielle de 5 cm et que la trame porte `_0cm`, l'enregistrer à 0,05 m avec la mention « profondeur normalisée » dans le journal des livraisons. Les relevés déjà stockés à 0 m restent tels quels (aucune réécriture d'historique), la bascule vaut pour les nouvelles trames.

Si vous préférez ne rien réinterpréter avant confirmation d'Olivier, on garde `0 cm` tel quel et on se limite au point 1.

### 3. Bandeau de cohérence dans le poste de contrôle
Sous la frise de chaque sonde, une ligne discrète : « Grandeurs attendues : 6 · reçues : 5 · manquante : humidité du sol 5 cm depuis 3 j ». C'est la preuve à montrer demain, et le déclencheur naturel du message au fournisseur.

## Détails techniques

- `src/lib/iot/grandeurs.ts` : petite table modèle → profondeurs attendues, dérivée du nom de sonde (`5/15`, `5/30`) avec repli sur les profondeurs déjà observées en base.
- `src/components/iot/HourMesuresWidget.tsx` et `SensorObservatory.tsx` : fusion des mesures reçues avec la grille attendue, rendu « non transmise ».
- `supabase/functions/iot-webhook-brad/index.ts` : normalisation optionnelle `_0cm` → 0,05 m, tracée dans `_lfdv.normalized`.
- Aucune migration : les colonnes `profondeur_m`, `interpretation`, `rejected` suffisent.

## Message à Olivier (Brad)

> Sur b26s002 (« 5/15 »), seules les clés `soilMoisture_15cm` / `soilTemperature_15cm` arrivent : le capteur superficiel n'émet rien. Sur b26s001 (« 5/30 »), le capteur superficiel est étiqueté `_0cm` — doit-on le lire comme 5 cm ? Peux-tu confirmer la nomenclature de profondeur attendue pour les deux modèles ?
