# PROMPT DEEPSEARCH PHASE B - TRANSFORMATION PDF → JSON OPUS-COMPATIBLE

## MISSION
Transformer un rapport PDF DEEPSEARCH Phase A en JSON 100% conforme au schéma OpusImportSchema.

## PRINCIPE FONDAMENTAL
- **Extraction exclusive** : Seules les données PDF sont utilisées (zéro invention)
- **Traçabilité complète** : Chaque donnée JSON référence sa section PDF
- **Validation garantie** : JSON produit doit être importable sans erreur

## RÈGLES JSON CRITIQUES

### ✅ SYNTAXE OBLIGATOIRE
```json
{
  "cle": "valeur",           // Guillemets doubles uniquement
  "nombre": 42,              // Nombres sans guillemets  
  "booleen": true,           // Minuscules: true/false
  "vide": null,              // Null minuscule
  "date": "2024-12-15"       // Dates ISO 8601 quotées
}
```

### ❌ CORRECTIONS AUTO-REQUISES
- `None` → `null`
- `True/False` → `true/false`  
- `today` → date ISO actuelle
- `TBD` → `"À déterminer"`
- Supprimer virgules finales

## STRUCTURE JSON OPUS STRICTE

```json
{
  "dimensions": {
    "contexte_hydrologique": {
      "description": "[Synthèse section hydrologie PDF]",
      "donnees": {
        "bassin_versant": "[Extrait PDF]",
        "regime_hydrologique": "[Extrait PDF]",
        "sources": ["[Référence PDF]"]
      }
    },
    "especes_caracteristiques": {
      "description": "[Synthèse biodiversité PDF]", 
      "donnees": {
        "poissons": [{"nom_commun": "[PDF]", "statut": "[PDF]"}],
        "sources": ["[Référence PDF]"]
      }
    },
    "vocabulaire_local": {
      "description": "[Synthèse vocabulaire PDF]",
      "donnees": {
        "termes_locaux": [{"terme": "[PDF]", "definition": "[PDF]"}],
        "sources": ["[Référence PDF]"]
      }
    },
    "empreintes_humaines": {
      "description": "[Synthèse infrastructures PDF]",
      "donnees": {
        "infrastructures": [{"nom": "[PDF]", "type": "[PDF]", "impact": "[PDF]"}],
        "sources": ["[Référence PDF]"]
      }
    },
    "projection_2035_2045": {
      "description": "[Synthèse prospective PDF]",
      "donnees": {
        "scenarios": [{"nom": "[PDF]", "description": "[PDF]"}],
        "sources": ["[Référence PDF]"]
      }
    },
    "leviers_agroecologiques": {
      "description": "[Synthèse agroécologie PDF]",
      "donnees": {
        "techniques": [{"nom": "[PDF]", "impact": "[PDF]"}],
        "sources": ["[Référence PDF]"]
      }
    },
    "nouvelles_activites": {
      "description": "[Synthèse nouvelles activités PDF]",
      "donnees": {
        "activites": [{"nom": "[PDF]", "objectifs": ["[PDF]"]}],
        "sources": ["[Référence PDF]"]
      }
    },
    "ia_fonctionnalites": {
      "description": "[Synthèse IA PDF]",
      "donnees": {
        "fonctionnalites_collectif": ["[PDF]"],
        "sources": ["[Référence PDF]"]
      }
    },
    "technodiversite": {
      "description": "[Synthèse techno PDF]",
      "donnees": {
        "solution": [{"nom": "[PDF]", "trl": "7-9", "type": "low-tech"}],
        "innovation": [{"nom": "[PDF]", "trl": "4-6", "type": "open-hardware"}], 
        "rupture": [{"nom": "[PDF]", "trl": "1-3", "type": "biomimetisme"}],
        "sources": ["[Référence PDF]"]
      }
    }
  },
  "sources": [
    {
      "titre": "[Titre exact PDF]",
      "type": "scientifique",
      "auteur": "[Auteur PDF]",
      "date_publication": "2024-12-15",
      "date_acces": "2024-12-15", 
      "url": "[URL si disponible]",
      "fiabilite": 85,
      "references": {"section": "[Section PDF]", "page": "[Page PDF]"}
    }
  ],
  "fables": [
    {
      "titre": "[Titre PDF]",
      "contenu_principal": "[Texte narratif PDF min 50 chars]",
      "dimension": "contexte_hydrologique",
      "ordre": 1,
      "tags": ["territoire", "eau", "dordogne"],
      "variations": {
        "courte": "[Version courte si disponible]",
        "longue": "[Version longue si disponible]"
      }
    }
  ],
  "metadata": {
    "sourcing_date": "2024-12-15",
    "import_date": "2024-12-15T10:00:00.000Z",
    "ai_model": "deepsearch-phase-b-v3",
    "pdf_source": "[Nom fichier PDF]",
    "gps_point": "[Coordonnées GPS territoire]",
    "territory_name": "[Nom territoire]",
    "quality_score": 85,
    "completeness_score": 90
  }
}
```

## MAPPING PDF → DIMENSIONS (COMPLET)

1. **Section hydrologie PDF** → `contexte_hydrologique`
2. **Section biodiversité PDF** → `especes_caracteristiques` 
3. **Section vocabulaire PDF** → `vocabulaire_local`
4. **Section infrastructure PDF** → `empreintes_humaines`
5. **Section prospective PDF** → `projection_2035_2045`
6. **Section agroécologie PDF** → `leviers_agroecologiques`
7. **Section nouvelles activités PDF** → `nouvelles_activites`
8. **Section IA PDF** → `ia_fonctionnalites`
9. **Section technologie PDF** → `technodiversite`

## VALIDATION FINALE

### Tests obligatoires :
- ✅ JSON.parse() sans erreur
- ✅ Structure `donnees` dans chaque dimension  
- ✅ Types sources valides : `web|scientifique|institutionnel|local|base_donnees|documentation|media`
- ✅ Technodiversité OPUS : `solution|innovation|rupture` (TRL 7-9|4-6|1-3)
- ✅ Minimum 1 source par dimension
- ✅ 9 dimensions maximum (selon sections PDF)

### Gestion erreurs :
- **PDF incomplet** : Omettre dimensions manquantes
- **Données ambiguës** : Copier texte exact + noter dans metadata
- **Sources incomplètes** : Marquer fiabilité à 50

### STRUCTURE TECHNODIVERSITÉ CRITIQUE ⚠️
```json
"technodiversite": {
  "donnees": {
    "solution": [{"trl": "7-9"}],     // Technologies matures
    "innovation": [{"trl": "4-6"}],   // En développement  
    "rupture": [{"trl": "1-3"}]       // Recherche
  }
}
```

## LIVRABLE FINAL
JSON valide, structure OPUS respectée, 9 dimensions complètes, importable directement.

**OBJECTIF** : Zéro erreur d'import, zéro correction manuelle post-traitement.

---
✅ **Version corrigée v4** - Structure technodiversité OPUS + 9 dimensions + metadata complètes