# PROMPT DEEPSEARCH PHASE B - TRANSFORMATION PDF → JSON OPUS-COMPATIBLE

## MISSION PRINCIPALE

Transformer les données validées du rapport PDF DEEPSEARCH Phase A en JSON structuré **100% conforme** au schéma OpusImportSchema, avec zéro invention et traçabilité complète.

## CONTEXTE D'EXÉCUTION

- **Source unique** : Rapport PDF DEEPSEARCH Phase A validé par contrôle humain
- **Output attendu** : JSON **strictement conforme** au schéma OpusImportSchema
- **Principe fondamental** : AUCUNE invention - extraction exclusive des données PDF
- **Validation** : Compatibilité 100% avec système OPUS (validation automatique réussie)

## PÉRIMÈTRE STRICT - PHASE B

### Données d'entrée obligatoires
- PDF DEEPSEARCH Phase A complet (15-25 pages)
- Point GPS exact du territoire étudié
- Période temporelle confirmée (2022-2025 + projections 2035-2045)

### Contraintes de transformation
- **Extraction pure** : Seules les données présentes dans le PDF sont utilisées
- **Traçabilité absolue** : Chaque donnée JSON référence sa section PDF
- **Structure respectée** : Mapping exact vers dimensions OpusImportSchema
- **Sources préservées** : Toutes les références bibliographiques maintenues
- **Validation garantie** : JSON produit doit passer OpusImportValidator sans erreur

## RÈGLES JSON STRICTES (CRITIQUES - ZERO ERREUR)

### ✅ SYNTAXE JSON OBLIGATOIRE
- **Guillemets doubles uniquement** : `"clé": "valeur"` (JAMAIS `'clé': 'valeur'`)
- **Pas de virgules finales** : `{"a": 1, "b": 2}` (JAMAIS `{"a": 1, "b": 2,}`)
- **Booléens minuscules** : `true`, `false` (JAMAIS `True`, `False`)
- **Null minuscule** : `null` (JAMAIS `None`, `NULL`, `nil`)
- **Dates ISO 8601 quotées** : `"2025-01-10"` ou `"2025-01-10T10:00:00.000Z"`
- **Nombres sans guillemets** : `90` (JAMAIS `"90"` pour les nombres)

### ❌ INTERDICTIONS ABSOLUES
- **Placeholders non quotés** : `today`, `now`, `yesterday`, `tomorrow`, `TBD`, `TBC`, `N/A`, `NA`, `unknown`
- **Variables non quotées** : `date_actuelle`, `valeur_defaut`, `a_determiner`
- **Expressions** : `Date.now()`, `new Date()`, `getCurrentDate()`
- **Commentaires** : `// commentaire`, `# commentaire`, `/* commentaire */`
- **Guillemets typographiques** : `"texte"`, `'texte'` → utiliser `"texte"`

### 🔧 CORRECTIONS AUTOMATIQUES REQUISES
Si présents dans le JSON, corriger automatiquement :
- `today` → `"2025-01-10"`
- `now` → `"2025-01-10T10:00:00.000Z"`
- `TBD` → `"À déterminer"`
- `None` → `null`
- `True` → `true`
- `False` → `false`
- `'texte'` → `"texte"` (pour les valeurs)
- Supprimer virgules finales avant `}` et `]`

## MAPPING PDF → JSON OBLIGATOIRE (OPUS-COMPATIBLE)

### 1. SYNTHÈSE EXÉCUTIVE → Métadonnées JSON
**Section PDF** : "1. SYNTHÈSE EXÉCUTIVE"
**Destination JSON** : `metadata`
```json
{
  "metadata": {
    "gps_point": "[extrait GPS exact du PDF]",
    "territory_name": "[nom territoire du PDF]",
    "sourcing_date": "2025-01-10",
    "import_date": "2025-01-10T10:00:00.000Z",
    "ai_model": "deepsearch-phase-b-v2",
    "validation_level": "manuelle",
    "quality_score": 85,
    "completeness_score": 90,
    "pdf_source": "[nom fichier PDF]",
    "transformation_notes": "[notes spécifiques transformation]"
  }
}
```

### 2. CONTEXTE HYDROLOGIQUE → Dimension `contexte_hydrologique`
**Section PDF** : "2. CONTEXTE HYDROLOGIQUE QUANTIFIÉ"
**Destination JSON** : `dimensions.contexte_hydrologique`
```json
{
  "dimensions": {
    "contexte_hydrologique": {
      "description": "[synthèse section 2 PDF]",
      "donnees": {
        "bassin_versant": "[bassin versant PDF]",
        "debit_moyen": "[débit moyen PDF section 2.1]",
        "regime_hydrologique": "[régime PDF section 2.2]",
        "qualite_eau": "[qualité eau PDF section 2.3]",
        "station_reference": "[station référence PDF section 2.4]",
        "niveaux_eau": "[niveaux d'eau PDF]",
        "temperature_eau": "[température PDF]",
        "sources": ["[source 1 PDF]", "[source 2 PDF]"]
      }
    }
  }
}
```

### 3. BIODIVERSITÉ → Dimension `especes_caracteristiques`
**Section PDF** : "3. BIODIVERSITÉ CARACTÉRISTIQUE - 5 ESPÈCES"
**Destination JSON** : `dimensions.especes_caracteristiques`
```json
{
  "dimensions": {
    "especes_caracteristiques": {
      "description": "[synthèse 5 espèces PDF]",
      "donnees": {
        "poissons": [
          {
            "nom_commun": "[nom espèce 1 PDF]",
            "nom_scientifique": "[nom scientifique PDF]",
            "statut_conservation": "[statut PDF]",
            "description": "[description complète PDF]"
          }
        ],
        "invertebres": ["[invertébrés identifiés PDF]"],
        "vegetation_aquatique": ["[végétation aquatique PDF]"],
        "oiseaux_aquatiques": ["[oiseaux identifiés PDF]"],
        "bio_indicateur": "[espèce bio-indicatrice principale PDF]",
        "sources": ["[source biodiversité PDF]"]
      }
    }
  }
}
```

### 4. VOCABULAIRE LOCAL → Dimension `vocabulaire_local`
**Section PDF** : "4. MÉMOIRE TERRITORIALE ET VOCABULAIRE LOCAL"
**Destination JSON** : `dimensions.vocabulaire_local`
```json
{
  "dimensions": {
    "vocabulaire_local": {
      "description": "[synthèse mémoire territoriale PDF]",
      "donnees": {
        "termes_locaux": [
          {
            "terme": "[terme local PDF]",
            "definition": "[définition PDF]",
            "origine": "[origine PDF]",
            "usage_context": "[contexte usage PDF]"
          }
        ],
        "phenomenes": [
          "[phénomène naturel local 1 PDF]",
          "[phénomène naturel local 2 PDF]"
        ],
        "pratiques": [
          "[pratique traditionnelle 1 PDF]",
          "[pratique traditionnelle 2 PDF]"
        ],
        "etymologie": "[racines linguistiques PDF section 4.4]",
        "sources": ["[source vocabulaire PDF]"]
      }
    }
  }
}
```

### 5. EMPREINTES HUMAINES → Dimension `empreintes_humaines`
**Section PDF** : "5. EMPREINTES HUMAINES STRATIFIÉES - 3 ÉLÉMENTS"
**Destination JSON** : `dimensions.empreintes_humaines`
```json
{
  "dimensions": {
    "empreintes_humaines": {
      "description": "[synthèse 3 empreintes PDF]",
      "donnees": {
        "infrastructures": [
          {
            "nom": "[infrastructure hydraulique PDF]",
            "type": "hydraulique",
            "description": "[description complète PDF]",
            "impact_ecologique": "[impact PDF]",
            "annee_construction": "[année PDF]"
          }
        ],
        "activites_economiques": ["[activité économique 1 PDF]", "[activité 2 PDF]"],
        "patrimoine_historique": ["[vestige historique significatif PDF]"],
        "amenagements_recents": ["[développement <10 ans PDF]"],
        "impact_environnemental": "[analyse impact global PDF]",
        "sources": ["[source empreintes PDF]"]
      }
    }
  }
}
```

### 6. PROSPECTIVE → Dimension `projection_2035_2045`
**Section PDF** : "6. PROSPECTIVE TERRITORIALE 2035-2045"
**Destination JSON** : `dimensions.projection_2035_2045`
```json
{
  "dimensions": {
    "projection_2035_2045": {
      "description": "[synthèse prospective complète PDF section 6]",
      "donnees": {
        "drivers_climatiques": [
          {
            "nom": "[moteur climatique PDF]",
            "description": "[description PDF]",
            "intensite_prevue": "modérée",
            "timeline": "[horizon temporel PDF]"
          }
        ],
        "impacts_anticipes": [
          {
            "domaine": "[domaine impact PDF]",
            "description": "[description impact PDF]",
            "probabilite": "[probabilité PDF]",
            "severite": "modérée"
          }
        ],
        "scenarios": [
          {
            "nom": "[nom scénario PDF]",
            "description": "[description scénario PDF]",
            "probabilite": "[probabilité PDF]",
            "mesures_adaptation": ["[mesure 1 PDF]", "[mesure 2 PDF]"]
          }
        ],
        "incertitudes": ["[incertitude 1 PDF]", "[incertitude 2 PDF]"],
        "sources": ["[source prospective PDF]"]
      }
    }
  }
}
```

### 7. LEVIERS AGROÉCOLOGIQUES → Dimension `leviers_agroecologiques`
**Section PDF** : "6.2 LEVIERS AGROÉCOLOGIQUES" (sous-section)
**Destination JSON** : `dimensions.leviers_agroecologiques`
```json
{
  "dimensions": {
    "leviers_agroecologiques": {
      "description": "[synthèse leviers agroéco PDF section 6.2]",
      "donnees": {
        "techniques": [
          {
            "nom": "[technique agroéco PDF]",
            "description": "[description technique PDF]",
            "cout_implementation": "[coût PDF]",
            "impact_environnemental": "[impact positif PDF]",
            "faisabilite": "modérée"
          }
        ],
        "benefices_attendus": ["[bénéfice 1 PDF]", "[bénéfice 2 PDF]"],
        "acteurs_impliques": ["[acteur 1 PDF]", "[acteur 2 PDF]"],
        "timeline_deployment": "[chronologie déploiement PDF]",
        "sources": ["[source agroéco PDF]"]
      }
    }
  }
}
```

### 8. NOUVELLES ACTIVITÉS → Dimension `nouvelles_activites`
**Section PDF** : "6.3 NOUVELLES ACTIVITÉS" (sous-section)
**Destination JSON** : `dimensions.nouvelles_activites`
```json
{
  "dimensions": {
    "nouvelles_activites": {
      "description": "[synthèse nouvelles activités PDF section 6.3]",
      "donnees": {
        "activites": [
          {
            "nom": "[nouvelle activité PDF]",
            "description": "[description activité PDF]",
            "objectifs": ["[objectif 1 PDF]", "[objectif 2 PDF]"],
            "livrables_12_mois": "[livrables concrets PDF]",
            "kpis": ["[KPI 1 PDF]", "[KPI 2 PDF]"],
            "budget_estime": "[budget PDF]"
          }
        ],
        "partenariats_possibles": ["[partenariat 1 PDF]", "[partenariat 2 PDF]"],
        "financement_potentiel": ["[financement 1 PDF]", "[financement 2 PDF]"],
        "sources": ["[source activités PDF]"]
      }
    }
  }
}
```

### 9. FONCTIONNALITÉS IA → Dimension `ia_fonctionnalites`
**Section PDF** : "7. IA RIVIÈRE DORDOGNE - 5 FONCTIONNALITÉS"
**Destination JSON** : `dimensions.ia_fonctionnalites`
```json
{
  "dimensions": {
    "ia_fonctionnalites": {
      "description": "[synthèse 5 fonctionnalités IA PDF]",
      "donnees": {
        "fonctionnalites_collectif": ["[fonctionnalité collective PDF]"],
        "outils_decision": ["[outil décision PDF]"],
        "interfaces_participatives": ["[interface poétique PDF]"],
        "algorithmes_vivant": ["[algorithme écologique PDF]"],
        "services_predictifs": ["[service prédictif PDF]"],
        "plateformes_partage": ["[plateforme collaboration PDF]"],
        "sources": ["[source IA PDF]"]
      }
    }
  }
}
```

### 10. TECHNODIVERSITÉ → Dimension `technodiversite` (FORMAT TRL OPUS)
**Section PDF** : "8. TECHNODIVERSITÉ STRATIFIÉE - 9 SOLUTIONS"
**Destination JSON** : `dimensions.technodiversite`
```json
{
  "dimensions": {
    "technodiversite": {
      "description": "[synthèse 9 solutions techno PDF]",
      "donnees": {
        "solution": [
          {
            "nom": "[solution TRL 7-9 PDF]",
            "description": "[description complète PDF]",
            "type": "low-tech",
            "autonomie_energetique": true,
            "cout_fabrication": "[coût PDF]",
            "documentation_ouverte": true,
            "trl": "7-9",
            "categorie": "mature"
          }
        ],
        "innovation": [
          {
            "nom": "[innovation TRL 4-6 PDF]",
            "description": "[description PDF]",
            "type": "open-hardware",
            "trl": "4-6",
            "categorie": "développement"
          }
        ],
        "rupture": [
          {
            "nom": "[rupture TRL 1-3 PDF]",
            "description": "[description PDF]",
            "type": "biomimetisme",
            "trl": "1-3",
            "categorie": "recherche"
          }
        ],
        "fabrication_locale": ["[fabrication locale PDF]"],
        "open_source_projects": ["[projet open source PDF]"],
        "impact_territorial": "[impact territorial global PDF]",
        "sources": ["[source technodiversité PDF]"]
      }
    }
  }
}
```

## EXTRACTION SOURCES ET FABLES (FORMAT OPUS STRICT)

### Sources PDF → JSON (FORMAT OPUS)
```json
{
  "sources": [
    {
      "titre": "[titre exact de la source PDF]",
      "url": "[URL complète si disponible PDF]",
      "type": "scientifique",
      "auteur": "[auteur complet PDF]",
      "date_publication": "2024-12-15",
      "date_acces": "2025-01-10",
      "fiabilite": 90,
      "references": {
        "pdf_section": "[section PDF où référencée]",
        "page_number": "[numéro page PDF]"
      }
    }
  ]
}
```

**Types autorisés** : `"web"`, `"base_donnees"`, `"documentation"`, `"scientifique"`, `"institutionnel"`, `"local"`, `"media"`

### Fables narratives (FORMAT OPUS)
```json
{
  "fables": [
    {
      "titre": "[titre fable extrait PDF]",
      "contenu_principal": "[contenu narratif complet extrait PDF - minimum 50 caractères]",
      "ordre": 1,
      "dimension": "contexte_hydrologique",
      "variations": {
        "courte": "[version courte si présente PDF]",
        "longue": "[version longue si présente PDF]"
      },
      "tags": ["territoires", "dordogne", "eau"],
      "inspiration_sources": {
        "pdf_section": "[section PDF source]",
        "narrative_elements": ["[élément narratif 1]", "[élément 2]"]
      }
    }
  ]
}
```

## INSTRUCTIONS DE TRANSFORMATION (OPUS-COMPATIBLE)

### Étape 1 - Lecture PDF complète
1. **Analyse intégrale** du PDF DEEPSEARCH Phase A
2. **Identification sections** selon structure 8 sections attendues
3. **Extraction données** par section avec références page exactes
4. **Vérification complétude** : minimum 7 dimensions obligatoires

### Étape 2 - Mapping systématique OPUS
1. **Correspondance stricte** : chaque section PDF → dimension JSON OPUS
2. **Structure `donnees`** : OBLIGATOIRE - jamais `data`
3. **Noms dimensions exacts** : utiliser noms OpusImportSchema uniquement
4. **Validation continue** : vérifier conformité schéma à chaque étape

### Étape 3 - Validation croisée OPUS
1. **Cohérence territoriale** : GPS et périmètre cohérents
2. **Cohérence temporelle** : période 2022-2025 respectée
3. **Sources OPUS** : format et types conformes schéma
4. **Métadonnées complètes** : tous champs requis populés

### Étape 4 - Contrôles qualité OPUS
1. **Validation OpusImportValidator** : JSON doit passer sans erreur
2. **Compteurs technodiversité** : vérifier cohérence avec système
3. **Structure complète** : toutes sections obligatoires présentes
4. **Traçabilité** : références PDF pour chaque donnée

## TEMPLATE JSON FINAL (OPUS-COMPATIBLE)

```json
{
  "dimensions": {
    "contexte_hydrologique": {
      "description": "...",
      "donnees": {
        "bassin_versant": "...",
        "sources": [...]
      }
    },
    "especes_caracteristiques": {
      "description": "...",
      "donnees": {
        "poissons": [...],
        "sources": [...]
      }
    },
    "vocabulaire_local": {
      "description": "...",
      "donnees": {
        "termes_locaux": [...],
        "sources": [...]
      }
    },
    "empreintes_humaines": {
      "description": "...",
      "donnees": {
        "infrastructures": [...],
        "sources": [...]
      }
    },
    "projection_2035_2045": {
      "description": "...",
      "donnees": {
        "drivers_climatiques": [...],
        "sources": [...]
      }
    },
    "leviers_agroecologiques": {
      "description": "...",
      "donnees": {
        "techniques": [...],
        "sources": [...]
      }
    },
    "nouvelles_activites": {
      "description": "...",
      "donnees": {
        "activites": [...],
        "sources": [...]
      }
    },
    "ia_fonctionnalites": {
      "description": "...",
      "donnees": {
        "fonctionnalites_collectif": [...],
        "sources": [...]
      }
    },
    "technodiversite": {
      "description": "...",
      "donnees": {
        "solution": [...],
        "innovation": [...],
        "rupture": [...],
        "sources": [...]
      }
    }
  },
  "fables": [
    {
      "titre": "...",
      "contenu_principal": "...",
      "ordre": 1,
      "dimension": "...",
      "variations": {...},
      "tags": [...],
      "inspiration_sources": {...}
    }
  ],
  "sources": [
    {
      "titre": "...",
      "type": "scientifique",
      "auteur": "...",
      "date_publication": "2024-12-15",
      "date_acces": "2025-01-10",
      "fiabilite": 90,
      "references": {...}
    }
  ],
  "metadata": {
    "sourcing_date": "2025-01-10",
    "import_date": "2025-01-10T10:00:00.000Z",
    "ai_model": "deepsearch-phase-b-v2",
    "validation_level": "manuelle",
    "quality_score": 85,
    "completeness_score": 90,
    "gps_point": "...",
    "territory_name": "...",
    "pdf_source": "...",
    "transformation_notes": "..."
  }
}
```

## RÈGLES ABSOLUES OPUS

### ❌ INTERDICTIONS CRITIQUES
- **JAMAIS `data`** → toujours `donnees`
- **JAMAIS dimension inventée** → uniquement noms OpusImportSchema
- **JAMAIS type source inventé** → uniquement types enum autorisés
- **JAMAIS technodiversité format libre** → obligatoirement `solution/innovation/rupture`
- **JAMAIS placeholders non quotés** → `today` → `"2025-01-10"`
- **JAMAIS tokens Python** → `None/True/False` → `null/true/false`

### ✅ OBLIGATIONS OPUS
- **Structure `donnees` obligatoire** dans chaque dimension
- **Noms dimensions exacts** : `contexte_hydrologique`, `especes_caracteristiques`, etc.
- **Sources format OPUS** : `titre`, `type`, `fiabilite` obligatoires
- **Métadonnées complètes** : tous champs requis
- **Validation garantie** : JSON doit passer OpusImportValidator
- **Syntaxe JSON stricte** : guillemets doubles, pas de virgules finales

### 🔍 CONTRÔLES QUALITÉ OPUS
- **Test validation** : lancer OpusImportValidator sur JSON produit
- **Compteurs cohérents** : vérifier technodiversité avec système
- **Structure conforme** : 100% compatible schéma OPUS
- **Import réussi** : JSON directement importable sans erreur
- **Syntaxe parfaite** : aucune erreur JSON.parse()

## GESTION CAS PARTICULIERS OPUS

### PDF incomplet
- **Dimensions manquantes** : omettre du JSON (pas d'invention)
- **Données partielles** : populer uniquement disponible
- **Noter limitations** : dans `transformation_notes`
- **Marquer pour révision** : dans `validation_level`

### Données ambiguës
- **Extraction littérale** : copier texte exact PDF
- **Référencer source** : page et section dans `references`
- **Noter ambiguïté** : dans `transformation_notes`
- **Validation manuelle** : `validation_level`: "manuelle"

### Format technodiversité complexe
- **Identifier TRL** : niveau de maturité technologique
- **Catégoriser** : solution (TRL 7-9), innovation (4-6), rupture (1-3)
- **Structure OPUS** : respecter format `solution/innovation/rupture`
- **Compter précisément** : assurer cohérence compteurs

---

**OBJECTIF OPUS** : Transformer PDF DEEPSEARCH en JSON **100% compatible OPUS**, validation automatique réussie, import sans erreur, compteurs corrects.

**RÉSULTAT ATTENDU** : Zero bug, zero rejet, zero recomptage !

---

Ce prompt corrigé garantit :
- ✅ **Compatibilité 100% OPUS** : structure exacte OpusImportSchema
- ✅ **Compteurs corrects** : technodiversité en format TRL strict
- ✅ **Validation automatique** : JSON passe OpusImportValidator sans erreur
- ✅ **Métadonnées complètes** : tous champs requis populés
- ✅ **Zero retraitement** : import direct sans corrections manuelles
- ✅ **Syntaxe JSON parfaite** : aucune erreur de parsing

Vos équipes DEEPSEARCH peuvent maintenant l'utiliser **en l'état** pour le troisième import !