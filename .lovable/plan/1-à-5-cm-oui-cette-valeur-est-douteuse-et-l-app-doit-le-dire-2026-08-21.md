# « 1 % à 5 cm » : oui, cette valeur est douteuse — et l'app doit le dire

## Ce que disent les données (vérifié en base)

Sonde **b26s001 (Potager d'Hiver)**, humidité du sol :

```text
5 cm    07→11 août : 28 à 33 %      16→21 août : 0 à 2 %   (293 relevés, jamais au-dessus de 2)
30 cm   16→21 août : 25 à 30 %      (décroissance lente et régulière, cohérente)
```

Deux faits :

1. Le canal 5 cm est passé d'un plateau à ~30 % à un plateau à ~1 % sans transition, autour du 16 août — pas une sécheresse, une marche d'escalier.
2. Sur la même sonde, au même moment, le 30 cm reste à 25–30 % et la température de surface respire normalement (22 à 28 °C). Le capteur émet donc bien, c'est la voie « humidité 5 cm » qui est suspecte.

Interprétation la plus probable : anneau de surface qui a perdu le contact avec la terre (déchaussement, poche d'air, croûte sèche) ou recalibration du canal côté fournisseur. Elle est à confirmer sur le terrain — l'app ne peut pas trancher seule, mais elle doit refuser d'afficher cette valeur comme un fait.

Le moteur d'alertes construit dans l'onglet « Alertes » le détecte déjà (hors plage d'usage : 2–60 %, plus valeur figée sur 5 jours). Le problème est que **la page Accueil, elle, l'affiche comme une donnée saine** — et va jusqu'à la couronner « le plus sec ».

## Ce que je propose

### 1. Un doute visible sur la vignette « Sondes actives du parc »

- La valeur douteuse s'affiche en retrait (teinte atténuée) avec une pastille **« à vérifier »**.
- Au survol / au tap : « 1 % depuis le 16 août alors que le 30 cm de la même sonde lit 27 % — contact sol à contrôler. »
- Le curseur reste sur la barre mais en gris : la valeur est montrée, jamais niée, jamais célébrée.

### 2. Plus de superlatif sur une valeur douteuse

« le plus sec », « le plus humide », « le plus chaud » ne se posent que sur des valeurs jugées fiables. Ici, « le plus sec » migrerait sur la sonde suivante, ou disparaîtrait si aucune valeur fiable ne reste.

### 3. Une échelle de parc assainie

La phrase « Échelle du parc — Humidité : 1 → 44 % » est aujourd'hui tirée vers le bas par ce 1 %. Les valeurs douteuses sortent du calcul min/max/médiane ; la note d'échelle mentionne « 1 relevé écarté ».

### 4. Le même verdict partout

Le jugement de fiabilité est calculé une seule fois et réutilisé par :
- la carte capteur (popup),
- l'onglet **Analyses** (verdict simple, tapis d'humidité, palette végétale) — pour ne pas recommander des plantes de milieu aride sur une mesure fausse,
- l'**IA de Jardin**, qui reçoit l'information « valeur signalée douteuse » plutôt que la valeur brute.

### 5. Un lien direct vers l'enquête

Sur la pastille « à vérifier » : un accès à l'Observatoire de la sonde calé sur le 14–21 août, là où la marche d'escalier est visible.

## Détails techniques

- Nouveau module `src/lib/iot/fiabilite.ts` : `jugerLecture(mesure, contexte)` réutilisant `DOMAINE` / `USAGE` / la détection de valeur figée déjà écrits dans `src/lib/iot/anomalies.ts`, plus une règle de cohérence inter-profondeurs (écart > 20 points entre 5 cm et 30 cm sur la même sonde, en régime stable).
- `src/lib/iot/keyReadings.ts` retourne `{ valeur, fiable, motif }` au lieu d'une valeur nue ; `SensorCardBody.tsx` et `SensorPeekDialog.tsx` consomment ce champ.
- Le calcul des superlatifs et de l'échelle du parc filtre sur `fiable`.
- Aucune modification du pipeline d'ingestion ni des données : rien n'est supprimé en base, seule la lecture est qualifiée.
- Optionnel, à valider : marquer la sonde en **maintenance** côté fiche capteur si le terrain confirme le déchaussement — le mécanisme existe déjà.

## Ce que ça ne fait pas

Ça ne corrige pas la mesure. Si le terrain confirme un défaut de contact, il faudra reficher la sonde ; l'app aura alors, à date, la trace du jour où la lecture a décroché.
