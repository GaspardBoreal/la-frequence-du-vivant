# « J'analyse » — la fuite est confirmée, et elle est encore active

## Ce que disent les données (vérifié à l'instant)

Les 7 prélèvements écrits hier soir ont bien été enregistrés, puis **écrasés ce matin à 10 h 25 min 28 s (Paris)**, au moment précis où la page a été rouverte. La base ne contient plus que :

```text
A  45.4135439 / 0.009046975   (aucune valeur)
B  45.41373…  / 0.009412…     (aucune valeur)
C  45.414032… / 0.009273…     (aucune valeur)
```

Ce sont exactement les 3 points affichés sur vos deux captures. Donc : **les données ne sont pas « mal affichées », elles ont été réellement détruites une seconde fois**, par l'application elle-même. Toute nouvelle restauration serait effacée au prochain chargement de la page. Il faut donc réparer la cause **avant** de restaurer.

## La cause, précisément

Le registre des prélèvements est géré par un même dispositif de sauvegarde automatique (1,5 s après chaque changement) qui est **instancié quatre fois en parallèle** : dans « J'analyse », « J'identifie », « La palette » et « La synthèse ». Chaque copie :

- charge la donnée **une seule fois**, à son montage, et ne se remet jamais à jour ensuite ;
- réécrit **la totalité** du registre dès que son état interne bouge, même sans aucune saisie de votre part.

Résultat : une copie montée avec une version périmée (ou avec le registre vide par défaut A·B·C) réécrit par-dessus la bonne version. C'est un écrasement « du dernier arrivé », silencieux et sans trace.

## Le correctif — trois verrous

### 1. Un seul scribe (frontend)

- Le dispositif reçoit un mode **lecture seule**, activé pour « J'identifie », « La palette » et « La synthèse » : ces onglets lisent, ne sauvegardent plus jamais.
- Seul « J'analyse » écrit.
- La sauvegarde automatique ne se déclenche plus qu'après une **modification réelle de l'utilisateur** (drapeau « modifié »), jamais au simple chargement ou re-rendu.
- L'état local se resynchronise quand la donnée serveur change, au lieu de rester figé sur sa première lecture.

### 2. Un garde-fou anti-destruction (base de données)

Un déclencheur refuse toute écriture qui ferait **perdre de la matière** au registre : moins de prélèvements qu'avant, ou perte de valeurs (texture, structure, pH, vie du sol, GPS, lieu) sur un prélèvement qui en avait. Une suppression volontaire reste possible via un indicateur explicite envoyé par l'interface. En cas de refus, l'écriture est rejetée avec un message clair au lieu d'être appliquée.

### 3. Une boîte noire (historique)

Chaque version du registre est archivée automatiquement (contenu, auteur, horodatage) dans une table d'historique. Un incident redevient réparable en une requête, sans PDF ni restauration de sauvegarde.

## Puis la restauration

Une fois les trois verrous en place, je réinjecte les 7 prélèvements :

- **A → E** à l'identique du carnet imprimé du 29/07/2026 (lieux, GPS, boudin/limon, bêche/grumeleuse, pH 8.0, vie du sol, vers comptés) ;
- **F · Massif Grenadier** et **G · L'Onde Courte** avec leurs tests attestés par les photos de terrain, valeurs à compléter et position à replacer à la main.

Puis je vérifie en rechargeant la page deux fois, et en ouvrant successivement les quatre onglets, que le registre reste intact.

## Périmètre

Strictement le registre des prélèvements de « J'analyse » et sa sauvegarde. Aucune autre section, aucun autre tableau, aucune autre propriété n'est touché.

## Détails techniques

- `src/hooks/propriete/usePropertySoil.ts` : option `{ readOnly }`, `dirtyRef` conditionnant l'effet de sauvegarde, re-hydratation sur changement de `query.data.updated_at`, et lecture partagée via le cache react-query.
- `TabIdentify.tsx`, `TabPalette.tsx`, `TabSynthesize.tsx` : passage en `readOnly: true`.
- Migration : table `propriete_soil_diagnostics_history` (+ GRANT, RLS, trigger `AFTER UPDATE`) et trigger `BEFORE UPDATE` de non-régression sur `samples`, avec paramètre d'échappement pour les suppressions volontaires.
- Restauration finale par une écriture ciblée sur la propriété `Jardin Monde DEVIAT` uniquement.
