

# Plan : Refonte du style visuel des Fables

## Diagnostic du problème

Actuellement, les fables utilisent un style minimaliste qui pose plusieurs problèmes :

| Élément actuel | Problème |
|----------------|----------|
| Cadre fin (0.5px) | Trop discret, "étriqué" |
| Padding 10mm | Texte trop serré contre les bords |
| Texte 100% italique | Fatigue visuelle sur 5-7 pages |
| Titre centré simple | Manque de caractère "fable" |
| Pas de différenciation | Morale, dialogues, sections indifférenciés |
| Largeur réduite | Impression de texte confiné |

## Solution proposée : Style "Carnet de Naturaliste"

Un style reconnaissable dès qu'on tourne la page, inspiré des carnets de terrain et éditions de fables classiques :

```text
┌─────────────────────────────────────────────┐
│                                             │
│           ❦ FABLE ❦                         │  ← Bandeau supérieur distinctif
│                                             │
│    La Discorde et les cent-vingt témoins    │  ← Titre en petites caps
│    ─────────────────────────────────        │
│                                             │
│  Combien de ponts construits ?              │  ← Corps roman (pas italique)
│  Combien d'ouvrages d'art détruits ?        │
│                                             │
│  Combien de passerelles tentées ?           │
│  Combien de médiations avortées ?           │
│                                             │
│  Et les aqueducs, les viaducs,              │  ← Vers poétiques fluides
│  Et les jetées, et les chaussées,           │
│                                             │
│    « Raccorder les rives,                   │  ← Dialogues en italique
│      Haubaner les quais,                    │
│      Ourler les berges,                     │
│      Réensauvager les ripisylves. »         │
│                                             │
│  ─────────────────────────────────          │
│                                             │
│  MORALE : Plus de cent ponts...             │  ← Morale mise en valeur
│                                             │
└─────────────────────────────────────────────┘
```

## Modifications techniques

### 1. Fichier `src/utils/pdfStyleGenerator.ts`

Refonte complète de la section `FABLE SPECIFIC` :

**Avant :**
```typescript
fableContainer: {
  flex: 1,
  padding: mmToPoints(8),
},
fableFrame: {
  borderWidth: 0.5,
  borderColor: colorScheme.accent,
  borderRadius: 2,
  padding: mmToPoints(10),
},
```

**Après :**
```typescript
// =========== FABLE SPECIFIC (Style Carnet de Naturaliste) ===========
fableContainer: {
  flex: 1,
  paddingHorizontal: mmToPoints(4),   // Utilise toute la largeur
  paddingVertical: mmToPoints(6),
},
fableHeader: {                        // NOUVEAU: Bandeau distinctif
  textAlign: 'center',
  marginBottom: mmToPoints(8),
  paddingBottom: mmToPoints(4),
  borderBottomWidth: 0.75,
  borderBottomColor: colorScheme.accent,
},
fableHeaderLabel: {                   // NOUVEAU: "❦ FABLE ❦"
  fontFamily: typography.bodyFont,
  fontSize: baseFontSize * 0.75,
  color: colorScheme.accent,
  letterSpacing: 3,
  marginBottom: mmToPoints(4),
},
fableTitle: {
  fontFamily: typography.headingFont,
  fontSize: headingFontSize * 0.85,
  fontWeight: 'bold',
  color: colorScheme.primary,
  textAlign: 'center',
  textTransform: 'none',              // Pas de caps forcées
  letterSpacing: 0.5,
},
fableContent: {
  fontFamily: typography.bodyFont,
  fontSize: baseFontSize,             // Police normale (pas italique)
  lineHeight: typography.lineHeight * 1.05,
  color: colorScheme.text,
  textAlign: 'left',
  marginTop: mmToPoints(6),
},
fableMoral: {                         // NOUVEAU: Style morale
  fontFamily: typography.bodyFont,
  fontSize: baseFontSize * 0.9,
  fontStyle: 'italic',
  color: colorScheme.secondary,
  marginTop: mmToPoints(10),
  paddingTop: mmToPoints(6),
  borderTopWidth: 0.5,
  borderTopColor: colorScheme.accent,
  textAlign: 'center',
},
fableSection: {                       // NOUVEAU: Sous-sections
  fontFamily: typography.headingFont,
  fontSize: baseFontSize * 0.85,
  fontWeight: 'bold',
  color: colorScheme.primary,
  marginTop: mmToPoints(8),
  marginBottom: mmToPoints(4),
},
```

### 2. Fichier `src/utils/pdfPageComponents.tsx`

Refonte du composant `FablePage` :

- Ajouter un en-tête "❦ FABLE ❦" avec ornement typographique
- Retirer le cadre englobant (`fableFrame`)
- Corps du texte en roman (pas italique)
- Détecter et styliser automatiquement la "Morale" en fin de fable
- Support du `wrap` pour pagination automatique sur plusieurs pages

### 3. Nouveaux éléments d'interface dans `PdfStylesRaw`

Ajouter les nouvelles propriétés au type :
- `fableHeader`
- `fableHeaderLabel`
- `fableMoral`
- `fableSection`

## Bénéfices attendus

| Amélioration | Impact |
|--------------|--------|
| **Plus large** | Texte occupe 90% de la largeur utile au lieu de 70% |
| **Plus lisible** | Corps en roman, italique réservé aux dialogues/citations |
| **Reconnaissable** | Bandeau "FABLE" distinctif en haut de chaque page |
| **Condensé** | Moins de padding = plus de texte par page |
| **Professionnel** | Style cohérent avec les éditions littéraires classiques |
| **Morale mise en valeur** | Séparateur + italique centré pour la sentence finale |

## Fichiers à modifier

1. `src/utils/pdfStyleGenerator.ts` — Nouveaux styles fable
2. `src/utils/pdfPageComponents.tsx` — Nouveau composant FablePage

