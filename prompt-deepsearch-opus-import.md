# PROMPT DEEPSEARCH OPUS — EXTRACTION EXHAUSTIVE & ULTRA-PROFESSIONNELLE

**MISSION CRITIQUE** : Produire un JSON exhaustif et ultra-précis avec extraction systématique et vérification méthodique de CHAQUE élément mentionné dans le document DEEPSEARCH.

## 🎯 PROTOCOLE D'EXTRACTION EXHAUSTIVE — OBLIGATOIRE

### ⚠️ RÈGLE ABSOLUE : TRIPLE LECTURE SYSTÉMATIQUE
1. **LECTURE 1 - BALAYAGE** : Identifier TOUS les éléments par dimension (faire une liste mentale)
2. **LECTURE 2 - EXTRACTION** : Extraire chaque élément avec sources précises  
3. **LECTURE 3 - VÉRIFICATION** : Contrôler exhaustivité et compter les éléments extraits

### 🔍 ESPÈCES CARACTÉRISTIQUES — EXTRACTION ULTRA-RIGOUREUSE
**PROTOCOLE OBLIGATOIRE :**
- **Scanner méthodiquement** : noms scientifiques, noms communs, mentions indirectes, références croisées
- **Catégories à vérifier** : poissons, invertébrés, végétation aquatique, oiseaux, mammifères, amphibiens, autres
- **Vérifier contextes** : présence/absence, abondance, statut de conservation, habitats, migrations
- **Sources obligatoires** : Pour CHAQUE espèce → source(s) précise(s) avec référence exacte
- **CONTRÔLE QUALITÉ** : Si moins de 5 espèces extraites → RELIRE impérativement le document

### 🏗️ EMPREINTES HUMAINES — INVENTAIRE SYSTÉMATIQUE  
**BALAYER EXHAUSTIVEMENT :**
- **Infrastructures hydrauliques** : barrages, seuils, écluses, digues, canaux, retenues
- **Réseaux techniques** : assainissement, AEP, pluvial, irrigation, drainage
- **Équipements industriels** : stations d'épuration, pompages, usines de traitement
- **Activités anthropiques** : extractions, industries, rejets, aménagements
- **Urbanisation** : ports, quais, ponts, routes, zones artificialisées
- **Quantifier si possible** : surfaces, débits, populations concernées

### 🗣️ VOCABULAIRE LOCAL — FOUILLE LINGUISTIQUE COMPLÈTE
**EXTRAIRE SYSTÉMATIQUEMENT :**
- **Toponymie** : noms locaux de lieux-dits, cours d'eau, zones remarquables  
- **Dialecte territorial** : expressions, termes techniques locaux, patois
- **Savoirs empiriques** : dictons météo, observations traditionnelles
- **Unités traditionnelles** : mesures anciennes, références temporelles locales
- **Pratiques nommées** : techniques artisanales, usages patrimoniaux

### 🌱 LEVIERS AGROÉCOLOGIQUES — ANALYSE TECHNIQUE FINE
**IDENTIFIER PRÉCISÉMENT :**
- **Systèmes de culture** : rotations, associations, couverts végétaux
- **Pratiques innovantes** : agroforesterie, permaculture, agriculture de conservation
- **Races et variétés** : espèces locales, semences paysannes, matériel génétique
- **Infrastructures agroécologiques** : haies, mares, bandes enherbées, corridors
- **Certifications** : bio, labels, démarches qualité territoriales

### 🚀 NOUVELLES ACTIVITÉS — INNOVATION & PROSPECTIVE
**SCANNER POUR :**
- **Économie verte émergente** : écotourisme, circuits courts, services écosystémiques
- **Projets pilotes** : expérimentations, démonstrateurs, projets de recherche
- **Économie circulaire** : recyclage, valorisation, symbioses industrielles
- **Formations/métiers** : nouvelles compétences, emplois verts, reconversions
- **Initiatives locales** : coopératives, associations, entreprises innovantes

### 🔧 TECHNODIVERSITÉ — VEILLE TECHNOLOGIQUE COMPLÈTE
**RÉPERTORIER :**
- **EnR et efficacité** : solaire, éolien, hydraulique, biomasse, géothermie
- **Innovations territoriales** : brevets locaux, solutions adaptées, R&D
- **Technologies numériques** : IoT environnemental, capteurs, modélisation, IA
- **Équipements spécialisés** : matériel de mesure, outils de gestion innovants
- **Partenariats R&D** : universités, centres techniques, collaborations

## ✅ CONTRÔLES QUALITÉ OBLIGATOIRES

### 🚨 SEUILS D'ALERTE (RELIRE SI NON ATTEINTS)
- **Espèces** : < 5 espèces → Document sous-exploité, RELIRE
- **Infrastructures** : < 3 éléments → Aménagements oubliés, RELIRE  
- **Vocabulaire** : < 3 termes → Patrimoine linguistique manqué, RELIRE
- **Activités nouvelles** : 0 élément → Innovation sous-détectée, RELIRE
- **Technologies** : < 2 éléments → Veille technologique incomplète, RELIRE

### 🔄 VALIDATION CROISÉE
1. **Cohérence géographique** : Couvrir tout le territoire d'étude
2. **Exhaustivité temporelle** : Intégrer toute la période 2022-2025  
3. **Sources complètes** : Chaque élément → minimum 1 source valide
4. **Déduplication** : Éviter doublons entre dimensions
5. **Traçabilité** : Chaque donnée → référence précise dans le document

---

INSTRUCTIONS CRITIQUES (à exécuter AVANT d'émettre la sortie):
1) Normalisation des caractères
- Remplacer toute séquence échappée issue de Markdown par le caractère brut:
  \_ → _  |  \[ → [  |  \] → ]  |  \( → (  |  \) → )  |  \~ → ~
- Ne pas échapper les ponctuations ou symboles Unicode (– — « » ≈ ≥ ≤ ° …). JSON supporte l'Unicode.

2) URLs – Conversion obligatoire
- Si une URL est fournie en format Markdown [texte](url), garder uniquement l'URL simple: "https://…".
- Si aucune URL n'est disponible, mettre null.
- Interdit: crochets, parenthèses ou backslashes dans les URLs.

3) Clés et structure – Canonique et sans accents
- Utiliser strictement ces clés snake_case (sans backslashes):
  dimensions.contexte_hydrologique, dimensions.especes_caracteristiques, dimensions.vocabulaire_local,
  dimensions.empreintes_humaines, dimensions.leviers_agroecologiques, dimensions.nouvelles_activites,
  dimensions.technodiversite, dimensions.projection_2035_2045 (optionnel),
  fables, sources
- Les sous‑clés attendues sont définies ci‑dessous dans le schéma. N'ajoutez aucune autre clé.
- MAPPING AUTOMATIQUE: Si vous avez du contenu "infrastructures_techniques", utilisez la clé "empreintes_humaines"
- MAPPING AUTOMATIQUE: Si vous avez du contenu "agroecologie", répartissez-le entre "leviers_agroecologiques" (pratiques, cultures, élevage, biodiversité) et "nouvelles_activites" (activités à développer)

4) Sources et références
- Chaque source_ids doit référencer un id présent dans sources (ex: "S00", "S01", …, pattern ^S\d+$).
- Si une source est référencée mais absente, l'AJOUTER dans sources avec valeurs minimales sûres:
  {"id":"Sxx","titre":"Source à compléter","url":null,"type":"web","date_acces":"YYYY-MM-DD","fiabilite":null}
- Dédupliquer toutes les occurrences dans source_ids et dans sources par id.
- Vérifier que date_acces est au format ISO AAAA-MM-JJ, sinon corriger.

5) Valeurs manquantes et types
- Utiliser null pour une valeur absente (ex: debit_moyen), [] pour une liste vide; pas de chaînes vides "".
- Conserver les champs textuels avec accents et unités dans des chaînes (ex: "2–6 m").
- Interdit: valeurs NaN/Infinity, commentaires, trailing commas.

6) Métadonnées
- NE PAS inclure de bloc metadata. Il sera géré côté serveur. Pas d'ai_model, validation_level, scores, etc.

7) Exhaustivité minimale et auto‑réparation
- Si une section requise manque, la CRÉER avec une structure vide/valide.
- Si un élément individuel est invalide et non corrigeable, le SUPPRIMER plutôt que produire un JSON invalide.

8) Sortie
- Sortie UNIQUE: le JSON final seulement, sans texte d'intro, sans balises de code, sans commentaires.
- Le JSON doit passer JSON.parse strictement.

SCHÉMA CONTRACTUEL (JSON Schema simplifié – à respecter et valider en interne, ne pas inclure dans la sortie):
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "additionalProperties": false,
  "required": ["dimensions", "fables", "sources"],
  "properties": {
    "dimensions": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "contexte_hydrologique",
        "especes_caracteristiques",
        "vocabulaire_local",
        "empreintes_humaines",
        "leviers_agroecologiques",
        "nouvelles_activites",
        "technodiversite"
      ],
      "properties": {
        "contexte_hydrologique": {
          "type": "object",
          "additionalProperties": false,
          "required": ["description", "donnees"],
          "properties": {
            "description": {"type": "string"},
            "donnees": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "bassin_versant","debit_moyen","regime_hydrologique","qualite_eau",
                "indicateurs_quantitatifs","observations_2022_2025",
                "drivers_prospectifs_2035_2045","impacts_anticipes","sources"
              ],
              "properties": {
                "bassin_versant": {
                  "type": "object",
                  "additionalProperties": false,
                  "required": ["intitule", "source_ids"],
                  "properties": {
                    "intitule": {"type": "string"},
                    "source_ids": {"type": "array", "items": {"type": "string", "pattern": "^S\\d+$"}}
                  }
                },
                "debit_moyen": {"type": ["string", "null"]},
                "regime_hydrologique": {
                  "type": "object",
                  "additionalProperties": false,
                  "required": ["intitule", "source_ids"],
                  "properties": {
                    "intitule": {"type": "string"},
                    "source_ids": {"type": "array", "items": {"type": "string", "pattern": "^S\\d+$"}}
                  }
                },
                "qualite_eau": {
                  "type": "object",
                  "additionalProperties": false,
                  "required": ["resume", "source_ids"],
                  "properties": {
                    "resume": {"type": "string"},
                    "source_ids": {"type": "array", "items": {"type": "string", "pattern": "^S\\d+$"}}
                  }
                },
                "indicateurs_quantitatifs": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["nom", "valeur", "source_ids"],
                    "properties": {
                      "nom": {"type": "string"},
                      "valeur": {"type": "string"},
                      "source_ids": {"type": "array", "items": {"type": "string", "pattern": "^S\\d+$"}}
                    }
                  }
                },
                "observations_2022_2025": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["fait", "source_ids"],
                    "properties": {
                      "fait": {"type": "string"},
                      "source_ids": {"type": "array", "items": {"type": "string", "pattern": "^S\\d+$"}}
                    }
                  }
                },
                "drivers_prospectifs_2035_2045": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["nom", "description", "source_ids"],
                    "properties": {
                      "nom": {"type": "string"},
                      "description": {"type": "string"},
                      "source_ids": {"type": "array", "items": {"type": "string", "pattern": "^S\\d+$"}}
                    }
                  }
                },
                "impacts_anticipes": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["nom", "description", "source_ids"],
                    "properties": {
                      "nom": {"type": "string"},
                      "description": {"type": "string"},
                      "source_ids": {"type": "array", "items": {"type": "string", "pattern": "^S\\d+$"}}
                    }
                  }
                },
                "sources": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["titre", "url", "type", "date_acces", "fiabilite", "id"],
                    "properties": {
                      "titre": {"type": "string"},
                      "url": {"type": ["string", "null"], "pattern": "^https?://.*$"},
                      "type": {"type": "string", "enum": ["web","document_interne","institutionnel","presse","association","entreprise","projet","evenement"]},
                      "date_acces": {"type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$"},
                      "fiabilite": {"type": ["number","null"]},
                      "id": {"type": "string", "pattern": "^S\\d+$"},
                      "note": {"type": ["string","null"]}
                    }
                  }
                }
              }
            }
          }
        },
        "especes_caracteristiques": {
          "type": "object",
          "additionalProperties": false,
          "required": ["description", "donnees"],
          "properties": {
            "description": {"type": "string"},
            "donnees": {
              "type": "object",
              "additionalProperties": false,
              "required": ["poissons","invertebres","vegetation_aquatique","oiseaux_aquatiques","sources"],
              "properties": {
                "poissons": {"type": "array", "items": {"$ref": "#/definitions/especeItem"}},
                "invertebres": {"type": "array", "items": {"$ref": "#/definitions/especeItem"}},
                "vegetation_aquatique": {"type": "array", "items": {"$ref": "#/definitions/especeItem"}},
                "oiseaux_aquatiques": {"type": "array", "items": {"$ref": "#/definitions/especeItem"}},
                "sources": {"type": "array", "items": {"$ref": "#/definitions/sourceObj"}}
              }
            }
          }
        },
        "vocabulaire_local": {
          "type": "object",
          "additionalProperties": false,
          "required": ["description", "donnees"],
          "properties": {
            "description": {"type": "string"},
            "donnees": {
              "type": "object",
              "additionalProperties": false,
              "required": ["termes", "termes_locaux", "sources"],
              "properties": {
                "termes": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["terme","definition","exemple","source_ids"],
                    "properties": {
                      "terme": {"type": "string"},
                      "definition": {"type": "string"},
                      "exemple": {"type": "string"},
                      "source_ids": {"type": "array", "items": {"type": "string", "pattern": "^S\\d+$"}}
                    }
                  }
                },
                "termes_locaux": {
                  "type": "object",
                  "additionalProperties": false,
                  "required": ["cours_eau","phenomenes","pratiques"],
                  "properties": {
                    "cours_eau": {"type": ["string","null"]},
                    "phenomenes": {"type": "array", "items": {"type": "string"}},
                    "pratiques": {"type": "array", "items": {"type": "string"}}
                  }
                },
                "sources": {"type": "array", "items": {"$ref": "#/definitions/sourceObj"}}
              }
            }
          }
        },
        "empreintes_humaines": {
          "type": "object",
          "additionalProperties": false,
          "required": ["description","donnees"],
          "properties": {
            "description": {"type": "string"},
            "donnees": {
              "type": "object",
              "additionalProperties": false,
              "required": ["ouvrages_hydrauliques","reseaux","equipements","complexes_industriels","sources"],
              "properties": {
                "ouvrages_hydrauliques": {"type": "array", "items": {"$ref": "#/definitions/elementDesc"}},
                "reseaux": {"type": "array", "items": {"$ref": "#/definitions/elementDesc"}},
                "equipements": {"type": "array", "items": {"$ref": "#/definitions/elementDesc"}},
                "complexes_industriels": {"type": "array", "items": {"$ref": "#/definitions/elementDesc"}},
                "sources": {"type": "array", "items": {"$ref": "#/definitions/sourceObj"}}
              }
            }
          }
        },
        "leviers_agroecologiques": {
          "type": "object",
          "additionalProperties": false,
          "required": ["description","donnees"],
          "properties": {
            "description": {"type": "string"},
            "donnees": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "pratiques_agricoles","cultures","elevage","biodiversite_cultivee",
                "leviers_agroecologiques","sources"
              ],
              "properties": {
                "pratiques_agricoles": {"type": "array", "items": {"$ref": "#/definitions/elementDesc"}},
                "cultures": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["nom","source_ids"],
                    "properties": {
                      "nom": {"type": "string"},
                      "source_ids": {"type": "array", "items": {"type": "string", "pattern": "^S\\d+$"}}
                    }
                  }
                },
                "elevage": {"type": "array", "items": {"$ref": "#/definitions/elementDesc"}},
                "biodiversite_cultivee": {"type": "array", "items": {"$ref": "#/definitions/elementDesc"}},
                "leviers_agroecologiques": {"type": "array", "items": {"$ref": "#/definitions/elementNameOnly"}},
                "sources": {"type": "array", "items": {"$ref": "#/definitions/sourceObj"}}
              }
            }
          }
        },
        "nouvelles_activites": {
          "type": "object",
          "additionalProperties": false,
          "required": ["description","donnees"],
          "properties": {
            "description": {"type": "string"},
            "donnees": {
              "type": "object",
              "additionalProperties": false,
              "required": ["activites_a_developper","sources"],
              "properties": {
                "activites_a_developper": {"type": "array", "items": {"$ref": "#/definitions/elementNameOnly"}},
                "sources": {"type": "array", "items": {"$ref": "#/definitions/sourceObj"}}
              }
            }
          }
        },
        "technodiversite": {
          "type": "object",
          "additionalProperties": false,
          "required": ["description","donnees"],
          "properties": {
            "description": {"type": "string"},
            "donnees": {
              "type": "object",
              "additionalProperties": false,
              "required": ["technologies_vertes","innovations_locales","numerique","recherche_developpement","sources"],
              "properties": {
                "technologies_vertes": {"type": "array", "items": {"$ref": "#/definitions/elementNameOnly"}},
                "innovations_locales": {"type": "array", "items": {"$ref": "#/definitions/elementNameOnly"}},
                "numerique": {"type": "array", "items": {"$ref": "#/definitions/elementNameOnly"}},
                "recherche_developpement": {"type": "array", "items": {"$ref": "#/definitions/elementNameOnly"}},
                "sources": {"type": "array", "items": {"$ref": "#/definitions/sourceObj"}}
              }
            }
          }
        }
      }
    },
    "fables": {"type": "array", "items": {"type": "object"}},
    "sources": {
      "type": "array",
      "items": {"$ref": "#/definitions/sourceObj"}
    }
  },
  "definitions": {
    "sourceObj": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id","titre","url","type","date_acces","fiabilite"],
      "properties": {
        "id": {"type": "string", "pattern": "^S\\d+$"},
        "titre": {"type": "string"},
        "url": {"type": ["string","null"], "pattern": "^https?://.*$"},
        "type": {"type": "string", "enum": ["web","document_interne","institutionnel","presse","association","entreprise","projet","evenement"]},
        "date_acces": {"type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$"},
        "fiabilite": {"type": ["number","null"]},
        "note": {"type": ["string","null"]}
      }
    },
    "especeItem": {
      "type": "object",
      "additionalProperties": false,
      "required": ["nom_commun","nom_scientifique","statut","source_ids"],
      "properties": {
        "nom_commun": {"type": "string"},
        "nom_scientifique": {"type": ["string","null"]},
        "statut": {"type": ["string","null"]},
        "source_ids": {"type": "array", "items": {"type": "string", "pattern": "^S\\d+$"}}
      }
    },
    "elementDesc": {
      "type": "object",
      "additionalProperties": false,
      "required": ["nom","description","source_ids"],
      "properties": {
        "nom": {"type": "string"},
        "description": {"type": "string"},
        "source_ids": {"type": "array", "items": {"type": "string", "pattern": "^S\\d+$"}}
      }
    },
    "elementNameOnly": {
      "type": "object",
      "additionalProperties": false,
      "required": ["nom","source_ids"],
      "properties": {
        "nom": {"type": "string"},
        "source_ids": {"type": "array", "items": {"type": "string", "pattern": "^S\\d+$"}}
      }
    }
  }
}

EXEMPLE DE GÉNÉRATION (structure seulement – À ADAPTER AU CONTENU, NE PAS INCLURE CETTE SECTION DANS LA SORTIE):
{
  "dimensions": {
    "contexte_hydrologique": {
      "description": "…",
      "donnees": {
        "bassin_versant": {"intitule": "…", "source_ids": ["S00","S02"]},
        "debit_moyen": null,
        "regime_hydrologique": {"intitule": "…", "source_ids": ["S00"]},
        "qualite_eau": {"resume": "…", "source_ids": ["S00","S04"]},
        "indicateurs_quantitatifs": [
          {"nom": "…", "valeur": "…", "source_ids": ["S00"]}
        ],
        "observations_2022_2025": [
          {"fait": "…", "source_ids": ["S00"]}
        ],
        "drivers_prospectifs_2035_2045": [
          {"nom": "…", "description": "…", "source_ids": ["S00"]}
        ],
        "impacts_anticipes": [
          {"nom": "…", "description": "…", "source_ids": ["S00"]}
        ],
        "sources": []
      }
    },
    "especes_caracteristiques": {"description": "…", "donnees": {"poissons": [], "invertebres": [], "vegetation_aquatique": [], "oiseaux_aquatiques": [], "sources": []}},
    "vocabulaire_local": {"description": "…", "donnees": {"termes": [], "termes_locaux": {"cours_eau": null, "phenomenes": [], "pratiques": []}, "sources": []}},
    "empreintes_humaines": {"description": "…", "donnees": {"ouvrages_hydrauliques": [], "reseaux": [], "equipements": [], "complexes_industriels": [], "sources": []}},
    "leviers_agroecologiques": {"description": "…", "donnees": {"pratiques_agricoles": [], "cultures": [], "elevage": [], "biodiversite_cultivee": [], "leviers_agroecologiques": [], "sources": []}},
    "nouvelles_activites": {"description": "…", "donnees": {"activites_a_developper": [], "sources": []}},
    "technodiversite": {"description": "…", "donnees": {"technologies_vertes": [], "innovations_locales": [], "numerique": [], "recherche_developpement": [], "sources": []}}
  },
  "fables": [],
  "sources": [
    {"id":"S00","titre":"…","url":"https://…","type":"web","date_acces":"2025-01-07","fiabilite":80}
  ]
}

GÉNÉRATION FINALE :
- Appliquer les 8 règles de normalisation/validation ci-dessus.
- Valider en interne le JSON contre le schéma; corriger/compléter si nécessaire.
- Émettre UNIQUEMENT le JSON final conforme (aucun texte, aucune métadonnée, aucun code fence).