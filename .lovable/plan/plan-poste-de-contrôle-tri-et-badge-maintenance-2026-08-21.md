# Plan : Poste de contrôle — tri et badge maintenance

## Objectif
Dans le menu **Poste de contrôle** (`/partenaire-iot/*?tab=controle`), les sondes déclarées **en maintenance** doivent être regroupées en fin de liste, chaque groupe (service, maintenance) étant trié par ordre alphabétique du nom de sonde, et la maintenance doit être visiblement identifiée.

## Diagnostic actuel
Le composant `src/components/iot/TelemetryControl.tsx` affiche `capteurs.map((c) => …)` sans tri ni regroupement. Le champ `etat` existe sur `iot_capteurs` et est déjà utilisé par `capteurEtat()` dans `src/lib/iot/grandeurs.ts`. Il n’y a actuellement aucun badge de maintenance dans la carte du Poste de contrôle.

## Changements prévus

### 1. Tri et regroupement dans `TelemetryControl.tsx`
Remplacer le mapping direct par une liste triée :

```text
service sondes    → triées par c.nom (A-Z)
maintenance sondes → triées par c.nom (A-Z), placées après
```

Les sondes à l’état `retire` (retirées) suivront la même logique, c’est-à-dire qu’elles resteront en fin de liste après les sondes en maintenance. Le tri s’applique au `capteurs` provenant du hook `useAllCapteurs()`.

### 2. Badge « En maintenance » dans la carte de vitalité
Dans l’en-tête de chaque carte de la liste, ajouter :
- Un badge coloré reprenant le label de `CAPTEUR_ETATS` (`etatMeta('maintenance')`) lorsque `capteurEtat(c) === 'maintenance'`.
- Le motif `c.etat_motif` en tooltip ou sous-badge s’il est renseigné.
- Une apparence légèrement atténuée de la frise `VitalityStrip` pour les sondes en maintenance, afin de ne pas prêter à confusion avec les sondes actives surveillées.

### 3. Aucun changement de données
Pas de modification de schéma, d’Edge Function ni de RLS. Seule la présentation et l’ordre d’affichage changent.

## Fichiers concernés
- `src/components/iot/TelemetryControl.tsx` — tri, regroupement, badge maintenance.
- `src/lib/iot/grandeurs.ts` — réutilisation existante de `capteurEtat` et `etatMeta`.

## Critères d’acceptation
1. Ouvrir le Poste de contrôle : les sondes en service apparaissent en premier, triées par nom.
2. Les sondes en maintenance apparaissent après les sondes en service, triées par nom.
3. Chaque sonde en maintenance affiche un badge « En maintenance ».
4. Les sondes en maintenance restent cliquables (heure, trame de test, etc.), mais leur état est lisible sans ambiguïté.
