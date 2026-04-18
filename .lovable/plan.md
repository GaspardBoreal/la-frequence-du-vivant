

## Enrichir l'export Événements avec les descriptions des marches

### Constat

Actuellement, la section "Marches associées" (Word & CSV) n'inclut que : nom, ville, latitude, longitude. Les champs `descriptif_court` et `descriptif_long` de la table `marches` sont chargés mais **ignorés** par l'export.

### Modifications (3 fichiers, surgicales)

#### 1. `src/components/admin/EventExportPanel.tsx` (1 ligne `.select`)

Ajouter les 2 colonnes dans les 2 requêtes Supabase (ligne 157 et ligne 175) :

```ts
.select('marche_id, marche:marches(id, nom_marche, ville, latitude, longitude, descriptif_court, descriptif_long)')
```

Et propager dans le `marches.map(...)` (ligne 161-167) :

```ts
descriptif_court: em.marche?.descriptif_court || null,
descriptif_long: em.marche?.descriptif_long || null,
```

#### 2. `src/utils/eventExportUtils.ts` — Type + Word + CSV

**a) Étendre `EventExportData['marches']`** :
```ts
descriptif_court: string | null;
descriptif_long: string | null;
```

**b) Word (section "Parcours")** — sous chaque ligne d'étape, si une description existe, ajouter un sous-bloc en italique gris, avec les balises HTML strippées (les descriptifs peuvent contenir du HTML enrichi) :

```text
1. Étape Nom — Ville (lat, lng)
   Présentation : Le sentier serpente entre…
   En détail   : (texte long)
```

Helper léger `stripHtml(s)` = `s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()`. Word ne rend pas le HTML brut, donc on l'aplatit en texte. Si une seule des 2 descriptions est présente, on n'affiche que celle-là. Si les deux sont vides, comportement actuel inchangé.

**c) CSV** — créer une **nouvelle section dédiée** `=== MARCHES ===` (déclenchée par `includeMarches`) plutôt que de polluer la section ÉVÉNEMENTS, car les descriptions peuvent être longues :

```
=== MARCHES ===
Événement,Type,Ordre,Nom marche,Ville,Latitude,Longitude,Présentation,En détail
```

Avec `escapeCSV(stripHtml(...))` pour préserver la lisibilité tabulaire (les retours à la ligne et virgules sont déjà gérés par `escapeCSV`).

#### 3. Aucune modification UI / aucun changement de checkbox

Les nouvelles données sont incluses automatiquement dès que **"Marches associées"** est cochée (case déjà présente). Aucun nouveau toggle, aucune migration SQL.

### Récapitulatif visuel Word

```text
Parcours — 3 étapes
─────────────────────
1. Marcher sur un sol qui respire — DEVIAT (45.6789, 0.1234)
   Présentation : Une matinée d'observation des sols vivants…
   En détail    : Le parcours débute au lavoir, traverse les prairies…

2. (étape suivante)
```

### Fichiers touchés

| Fichier | Nature |
|---|---|
| `src/components/admin/EventExportPanel.tsx` | +2 colonnes au `select`, +2 champs au mapping |
| `src/utils/eventExportUtils.ts` | Type étendu, helper `stripHtml`, sous-bloc Word, nouvelle section CSV `=== MARCHES ===` |

Aucune migration, aucune RLS, aucun impact sur les autres exports (Textes).

