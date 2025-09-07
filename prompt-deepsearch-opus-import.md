# Prompt DEEPSEARCH OPUS – JSON Strict + Auto‑validation (Sortie unique JSON)

Objectif: Produire un JSON parfaitement valide, auto‑corrigé et conforme au schéma d’import OPUS. Aucune vérification humaine. Aucune section « metadata ».

INSTRUCTIONS CRITIQUES (à exécuter AVANT d’émettre la sortie):
1) Normalisation des caractères
- Remplacer toute séquence échappée issue de Markdown par le caractère brut:
  \_ → _  |  \[ → [  |  \] → ]  |  \( → (  |  \) → )  |  \~ → ~
- Ne pas échapper les ponctuations ou symboles Unicode (– — « » ≈ ≥ ≤ ° …). JSON supporte l’Unicode.

2) URLs – Conversion obligatoire
- Si une URL est fournie en format Markdown [texte](url), garder uniquement l’URL simple: "https://…".
- Si aucune URL n’est disponible, mettre null.
- Interdit: crochets, parenthèses ou backslashes dans les URLs.

3) Clés et structure – Canonique et sans accents
- Utiliser strictement ces clés snake_case (sans backslashes):
  dimensions.contexte_hydrologique, dimensions.especes_caracteristiques, dimensions.vocabulaire_local,
  dimensions.infrastructures_techniques, dimensions.agroecologie, dimensions.technodiversite,
  fables, sources
- Les sous‑clés attendues sont définies ci‑dessous dans le schéma. N’ajoutez aucune autre clé.

4) Sources et références
- Chaque source_ids doit référencer un id présent dans sources (ex: "S00", "S01", …, pattern ^S\d+$).
- Si une source est référencée mais absente, l’AJOUTER dans sources avec valeurs minimales sûres:
  {"id":"Sxx","titre":"Source à compléter","url":null,"type":"web","date_acces":"YYYY-MM-DD","fiabilite":null}
- Dédupliquer toutes les occurrences dans source_ids et dans sources par id.
- Vérifier que date_acces est au format ISO AAAA-MM-JJ, sinon corriger.

5) Valeurs manquantes et types
- Utiliser null pour une valeur absente (ex: debit_moyen), [] pour une liste vide; pas de chaînes vides "".
- Conserver les champs textuels avec accents et unités dans des chaînes (ex: "2–6 m").
- Interdit: valeurs NaN/Infinity, commentaires, trailing commas.

6) Métadonnées
- NE PAS inclure de bloc metadata. Il sera géré côté serveur. Pas d’ai_model, validation_level, scores, etc.

7) Exhaustivité minimale et auto‑réparation
- Si une section requise manque, la CRÉER avec une structure vide/valide.
- Si un élément individuel est invalide et non corrigeable, le SUPPRIMER plutôt que produire un JSON invalide.

8) Sortie
- Sortie UNIQUE: le JSON final seulement, sans texte d’intro, sans balises de code, sans commentaires.
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
        "infrastructures_techniques",
        "agroecologie",
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
        "infrastructures_techniques": {
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
        "agroecologie": {
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
                "leviers_agroecologiques","activites_a_developper","sources"
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
    "infrastructures_techniques": {"description": "…", "donnees": {"ouvrages_hydrauliques": [], "reseaux": [], "equipements": [], "complexes_industriels": [], "sources": []}},
    "agroecologie": {"description": "…", "donnees": {"pratiques_agricoles": [], "cultures": [], "elevage": [], "biodiversite_cultivee": [], "leviers_agroecologiques": [], "activites_a_developper": [], "sources": []}},
    "technodiversite": {"description": "…", "donnees": {"technologies_vertes": [], "innovations_locales": [], "numerique": [], "recherche_developpement": [], "sources": []}}
  },
  "fables": [],
  "sources": [
    {"id":"S00","titre":"…","url":null,"type":"web","date_acces":"2025-09-07","fiabilite":null}
  ]
}

RÉSUMÉ D’EXÉCUTION POUR DEEPSEARCH
- Appliquer les 8 règles de normalisation/validation/auto‑correction ci‑dessus.
- Vérifier en interne le JSON contre le schéma; corriger/compléter si nécessaire.
- Émettre UNIQUEMENT le JSON final conforme (aucun texte, aucune métadonnée, aucun code fence).
