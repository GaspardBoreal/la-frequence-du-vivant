
# Index Vivant : Orbites Thématiques

## Vision

Remplacer la navigation linéaire actuelle par une **cartographie sémantique orbitale** où les 7 grandes familles thématiques deviennent des "planètes" ou "attracteurs gravitationnels" autour desquels les mots-clés extraits des textes orbitent comme des satellites vivants.

Le lecteur ne consulte plus un index : il **traverse un cosmos de sens**.

---

## Concept : Les Sept Mondes

Chaque catégorie devient un "monde" avec sa propre identité visuelle et son comportement :

```text
                    ◐ Temporalités
                   (pulsation lente, 
                    couleur ambre)
                         
    ◑ Technologies                    ◐ Hydrologie
    (rotation rapide,               (ondulation fluide,
     bleu électrique)                 bleu profond)
                         
              ⬤ CENTRE : Le Recueil
              
    ◐ Ouvrages                        ◐ Faune
    (statique massif,               (vol erratique,
     gris pierre)                    vert émeraude)
                         
                    ◐ Flore
                   (croissance lente,
                    vert mousse)
                    
                    ◐ Geste Poétique
                   (respiration profonde,
                    doré/accent)
```

---

## Architecture de l'Interface

### 1. Vue Centrale : Le Cosmos des Mondes

Une visualisation SVG radiale/orbitale :

- **Centre** : Le titre du recueil, pulsant doucement
- **7 orbites** : Chaque catégorie thématique sur une trajectoire circulaire
- **Satellites** : Les mots-clés extraits des textes orbitent autour de leur catégorie parente
- **Interactions** :
  - Survol d'un monde : les satellites (mots-clés) s'illuminent et affichent le nombre d'occurrences
  - Clic sur un monde : zoom sur cette catégorie, affichage de tous les mots-clés et des textes associés
  - Animation continue : rotation lente différenciée par catégorie (Technologies tourne vite, Temporalités lentement)

### 2. Mode Détail : Exploration d'un Monde

Quand l'utilisateur clique sur une catégorie :

- Transition fluide vers une vue focalisée
- Liste des mots-clés trouvés dans les textes, avec :
  - Nombre d'occurrences
  - Animation de "gravité" (plus il y a d'occurrences, plus le mot est proche du centre)
- Bouton retour vers la vue cosmique

### 3. Indicateurs Visuels

- **Taille des mondes** : proportionnelle au nombre total de mots-clés trouvés dans cette catégorie
- **Luminosité** : plus une catégorie est dense en textes, plus elle brille
- **Particules orbitales** : des particules fines connectent les mondes partageant des textes communs

---

## Comportements Animés par Catégorie

Chaque monde a une "personnalité" visuelle unique :

| Catégorie | Animation | Couleur | Métaphore |
|-----------|-----------|---------|-----------|
| Faune | Mouvement erratique, vol | Vert émeraude | La migration |
| Hydrologie | Ondulation sinusoïdale | Bleu profond | Le courant |
| Ouvrages | Statique massif, pulsation lente | Gris pierre | La permanence |
| Flore | Croissance organique lente | Vert mousse | L'enracinement |
| Temporalités | Pulsation très lente, halo | Ambre/Or | Le temps qui passe |
| Geste Poétique | Respiration (scale in/out) | Couleur accent du thème | Le souffle |
| Technologies | Rotation rapide, clignotement | Bleu électrique | Le signal |

---

## Logique de Données

Extraction des mots-clés depuis les textes :

```text
Pour chaque texte dans `textes`:
  Pour chaque catégorie dans KEYWORD_CATEGORIES:
    Scanner le contenu du texte
    Compter les occurrences de chaque mot-clé
    Stocker: { catégorie, mot-clé, occurrences, texte_ids[] }
    
Résultat:
  - Données par monde (catégorie)
  - Données par satellite (mot-clé)
  - Connexions entre mondes (textes partagés)
```

---

## Exemple Visuel

```text
+--------------------------------------------------+
|              INDEX VIVANT                         |
|    Les sept mondes de la Dordogne                |
+--------------------------------------------------+
|                                                  |
|          ○ Temporalités                          |
|              2050 · mémoire · avenir            |
|                                                  |
|    ● Technologies           ○ Hydrologie         |
|       IA · drone                étiage · crue   |
|                                                  |
|              ◉ LA FREQUENCE                      |
|              DU VIVANT                           |
|                                                  |
|    ○ Ouvrages               ● Faune              |
|       barrage                  saumon · loutre  |
|                                                  |
|          ○ Flore                                 |
|             saule · vigne                        |
|                                                  |
|              ◐ Geste Poétique                    |
|                 fréquence · silence              |
|                                                  |
+--------------------------------------------------+
|  Survolez un monde pour explorer ses satellites  |
+--------------------------------------------------+
```

---

## Interactions Detaillees

### Survol d'un Monde

```text
1. Le monde s'agrandit (scale: 1.2)
2. Les satellites (mots-clés) apparaissent autour
3. Un halo lumineux entoure le monde
4. Les autres mondes s'estompent (opacity: 0.4)
5. Affichage: "12 occurrences dans 8 textes"
```

### Clic sur un Monde (Vue Detail)

```text
+--------------------------------------------------+
|  ← Retour                                        |
|                                                  |
|              HYDROLOGIE                          |
|        Dynamiques Fluviales                      |
|                                                  |
|    +----------------------------------------+    |
|    |                                        |    |
|    |    ●●● étiage (15)                    |    |
|    |      ●● crue (8)                      |    |
|    |       ● mascaret (3)                  |    |
|    |        · confluence (2)               |    |
|    |         · méandre (1)                 |    |
|    |                                        |    |
|    +----------------------------------------+    |
|                                                  |
|    Textes associés:                              |
|    - "Le saumon remonte" (Bergerac)             |
|    - "Mascaret d'automne" (Libourne)            |
|                                                  |
+--------------------------------------------------+
```

---

## Section Technique

### Fichiers a Modifier

1. `src/components/admin/LivingIndex.tsx` - Refonte complete

### Nouvelles Dependances Utilisees

- `framer-motion` (deja installe) pour les animations orbitales
- `lucide-react` pour les icones de retour

### Structure du Composant

```text
LivingIndex
  ├── useExtractedKeywords() - Hook pour extraire les mots-cles des textes
  ├── OrbitalView - Vue cosmique principale (7 mondes)
  │   ├── WorldNode - Composant pour chaque monde/categorie
  │   └── SatelliteOrbit - Mots-cles orbitant
  └── WorldDetailView - Vue detaillee d'une categorie
      ├── KeywordList - Liste des mots-cles avec occurrences
      └── AssociatedTexts - Textes lies (optionnel)
```

### Logique d'Extraction des Mots-Cles

Reutilisation de la logique existante de `wordExportUtils.ts`:
- Import de `KEYWORD_CATEGORIES`
- Scan du contenu des textes pour detecter les occurrences
- Agregation par categorie avec comptage

### Animations Framer Motion

```text
WorldNode:
  - animate: { rotate: [0, 360] } avec duration variable par categorie
  - whileHover: { scale: 1.2 }
  - Transition spring pour les interactions

SatelliteOrbit:
  - Positionnement en cercle autour du monde parent
  - animate: { opacity: [0.5, 1, 0.5] } pour l'effet "vivant"
  - staggerChildren pour apparition progressive
```

### Palette de Couleurs par Monde

```text
faune: #059669 (emerald-600)
hydrologie: #1d4ed8 (blue-700)
ouvrages: #6b7280 (gray-500)
flore: #65a30d (lime-600)
temporalites: #d97706 (amber-600)
poetique: colorScheme.accent (theme-dependent)
technologies: #3b82f6 (blue-500)
```

### Dimensions SVG

- ViewBox: 100x100 (carre pour disposition radiale)
- Centre: (50, 50)
- Rayons orbitaux: 15, 25, 35 (trois orbites concentriques)
- Taille des mondes: 3-8 (variable selon densite)

