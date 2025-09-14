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
- `today` → `"[DATE_ACTUELLE]"`
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
    "technodiversite": {
      "description": "[Synthèse techno PDF]",
      "donnees": {
        "technologies_matures": [{"nom": "[PDF]", "trl": "7-9"}],
        "innovations": [{"nom": "[PDF]", "trl": "4-6"}], 
        "recherche": [{"nom": "[PDF]", "trl": "1-3"}],
        "sources": ["[Référence PDF]"]
      }
    }
  },
  "sources": [
    {
      "titre": "[Titre exact PDF]",
      "type": "scientifique",
      "auteur": "[Auteur PDF]", 
      "fiabilite": 85,
      "references": {"section": "[Section PDF]"}
    }
  ],
  "fables": [
    {
      "titre": "[Titre PDF]",
      "contenu_principal": "[Texte narratif PDF min 50 chars]",
      "dimension": "contexte_hydrologique",
      "ordre": 1
    }
  ],
  "metadata": {
    "sourcing_date": "[DATE_ACTUELLE]",
    "ai_model": "deepsearch-phase-b-v3",
    "pdf_source": "[Nom fichier PDF]",
    "quality_score": 85
  }
}
```

## MAPPING PDF → DIMENSIONS

1. **Section hydrologie PDF** → `contexte_hydrologique`
2. **Section biodiversité PDF** → `especes_caracteristiques` 
3. **Section vocabulaire PDF** → `vocabulaire_local`
4. **Section infrastructure PDF** → `empreintes_humaines`
5. **Section prospective PDF** → `projection_2035_2045`
6. **Section technologie PDF** → `technodiversite`

## VALIDATION FINALE

### Tests obligatoires :
- ✅ JSON.parse() sans erreur
- ✅ Structure `donnees` dans chaque dimension  
- ✅ Types sources valides : `web|scientifique|institutionnel|local`
- ✅ Technodiversité en 3 catégories TRL
- ✅ Minimum 1 source par dimension

### Gestion erreurs :
- **PDF incomplet** : Omettre dimensions manquantes
- **Données ambiguës** : Copier texte exact + noter dans metadata
- **Sources incomplètes** : Marquer fiabilité à 50

## LIVRABLE FINAL
JSON valide, structure OPUS respectée, importable directement sans retraitement.

**OBJECTIF** : Zéro erreur d'import, zéro correction manuelle post-traitement.