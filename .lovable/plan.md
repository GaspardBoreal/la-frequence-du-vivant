# Première réception : afficher la vraie date d'origine

## Diagnostic (vérifié en base)

L'encart « Première réception » de l'Atlas vivant est calculé sur la **fenêtre glissante de 48 h** (`vitalityStats` reçoit uniquement les pings des 48 dernières heures). Il affiche donc mécaniquement une date d'il y a deux jours (19.08.2026), pas la mise en service du parc.

Valeurs réelles en base (toutes sondes actives, tous horodatages) :

```text
Sonde Potager d'Hiver   05.08.2026 08:54 (Paris)   3 656 mesures   dernière 21.08 07:47
Sonde Potager d'Été     05.08.2026 10:03           3 298 mesures   dernière 21.08 07:39
Sonde Verger            05.08.2026 10:16             396 mesures   dernière 14.08 20:58 (hors service)
Station météo           16.08.2026 20:15             808 mesures   dernière 21.08 08:00
```

Valeur attendue pour « Première réception » du parc : **mer. 5 août 2026, 08:54** (Sonde Potager d'Hiver), soit 16 jours d'écoute et non 2.

## Correctif proposé

1. **Nouvelle lecture « origine »**, indépendante de la fenêtre 48 h : une requête légère qui remonte, pour chaque sonde active en service, la mesure la plus ancienne (tri croissant, 1 ligne par sonde). Coût négligeable, aucune pagination.
2. **Atlas vivant** : « Première réception » affiche cette date d'origine du parc (min sur les sondes retenues), avec une mention discrète « depuis la mise en service · N sondes » et l'ancienneté en jours. « Dernière réception », « Régularité » et « Silence » restent sur la fenêtre 48 h (ce sont des indicateurs de rythme courant).
3. **Fiche sonde (Vitalité · 48 h)** : même logique, « Première » devient la première réception de cette sonde depuis sa mise en service ; le libellé de la ligne précise « depuis le … » pour lever l'ambiguïté avec la frise 48 h.
4. **Sondes retenues** : uniquement actives et non en maintenance, cohérent avec le reste de la vue.

## Détails techniques

- `src/hooks/iot/useIotTelemetry.ts` : ajout d'un hook `useSensorsOrigin(capteurIds)` (requête `iot_mesures` triée `mesure_at asc`, `limit 1` par capteur, mise en cache longue — la donnée ne bouge plus).
- `src/lib/iot/vitality.ts` : `VitalityStats` gagne un champ optionnel `origin` alimenté par ce hook ; helper `fmtAnciennete(iso)` pour « 16 jours d'écoute ».
- `src/components/iot/console/VitalityAtlas.tsx` et `src/components/iot/SensorCardBody.tsx` : consommation du même hook, aucune duplication de calcul.
