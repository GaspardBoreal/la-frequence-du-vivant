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
        "sources": ["S01", "S02"]
      }
    },
    "especes_caracteristiques": {
      "description": "[Synthèse biodiversité PDF]", 
      "donnees": {
        "flore": [
          {"nom_commun": "Aulne glutineux", "nom_scientifique": "Alnus glutinosa", "statut": "[Statut PDF]", "description_courte": "[Description PDF]"},
          {"nom_commun": "Saule blanc", "nom_scientifique": "Salix alba", "statut": "[Statut PDF]", "description_courte": "[Description PDF]"}
        ],
        "poissons": [
          {"nom_commun": "Saumon atlantique", "nom_scientifique": "Salmo salar", "statut": "[Statut PDF]", "description_courte": "[Description PDF]"}
        ],
        "mammiferes": [
          {"nom_commun": "Loutre d'Europe", "nom_scientifique": "Lutra lutra", "statut": "[Statut PDF]", "description_courte": "[Description PDF]"}
        ],
        "insectes": [
          {"nom_commun": "Manne blanche", "nom_scientifique": "Ephoron virgo", "statut": "[Statut PDF]", "description_courte": "[Description PDF]"}
        ],
        "oiseaux": [
          {"nom_commun": "[Espèce PDF]", "nom_scientifique": "[Nom scientifique PDF]", "statut": "[Statut PDF]", "description_courte": "[Description PDF]"}
        ],
        "sources": ["S03"]
      }
    },
    "vocabulaire_local": {
      "description": "[Synthèse vocabulaire PDF]",
      "donnees": {
        "termes_locaux": [{"terme": "[PDF]", "definition": "[PDF]"}],
        "sources": ["S04"]
      }
    },
    "empreintes_humaines": {
      "description": "[Synthèse infrastructures PDF]",
      "donnees": {
        "infrastructures": [{"nom": "[PDF]", "type": "[PDF]", "impact": "[PDF]"}],
        "sources": ["S05"]
      }
    },
    "projection_2035_2045": {
      "description": "[Synthèse prospective PDF]",
      "donnees": {
        "scenarios": [{"nom": "[PDF]", "description": "[PDF]"}],
        "sources": ["S06"]
      }
    },
    "leviers_agroecologiques": {
      "description": "[Synthèse agroécologie PDF]",
      "donnees": {
        "techniques": [{"nom": "[PDF]", "impact": "[PDF]"}],
        "sources": ["S07"]
      }
    },
    "nouvelles_activites": {
      "description": "[Synthèse nouvelles activités PDF]",
      "donnees": {
        "activites": [{"nom": "[PDF]", "objectifs": ["[PDF]"]}],
        "sources": ["S08"]
      }
    },
    "ia_fonctionnalites": {
      "description": "[Synthèse IA PDF]",
      "donnees": {
        "fonctionnalites_collectif": ["[PDF]"],
        "sources": ["S09"]
      }
    },
    "technodiversite": {
      "description": "[Synthèse techno PDF]",
      "donnees": {
        "solution": [{"nom": "[PDF]", "trl": "7-9", "type": "low-tech"}],
        "innovation": [{"nom": "[PDF]", "trl": "4-6", "type": "open-hardware"}], 
        "rupture": [{"nom": "[PDF]", "trl": "1-3", "type": "biomimetisme"}],
        "sources": ["S10"]
      }
    }
  },
  "sources": [
    {
      "titre": "[Titre exact PDF]",
      "type": "scientifique",
      "auteur": "[Auteur PDF]",
      "date_publication": "[Date publication]",
      "date_acces": "[Date accès]", 
      "url": "[URL si disponible]",
      "fiabilite": 85,
      "references": ["S01"]
    },
    {
      "titre": "[Source institutionnelle]",
      "type": "institutionnel",
      "auteur": "[Organisation]",
      "fiabilite": 90,
      "references": ["S02"]
    },
    {
      "titre": "[Source web locale]",
      "type": "web",
      "url": "[URL source web]",
      "fiabilite": 70,
      "references": ["S03"]
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
    "sourcing_date": "[Date du jour ISO]",
    "import_date": "[DateTime du jour ISO]",
    "ai_model": "deepsearch-phase-b-v4",
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

## STRUCTURE ESPÈCES CARACTÉRISTIQUES CRITIQUE ⚠️

**IMPÉRATIF** : Chaque espèce mentionnée dans le PDF DOIT être catégorisée selon sa taxonomie biologique :

```json
"especes_caracteristiques": {
  "description": "[Synthèse complète de toutes les espèces PDF]",
  "donnees": {
    "flore": [
      {"nom_commun": "[Espèce végétale PDF]", "nom_scientifique": "[Nom latin PDF]", "statut": "[Statut PDF]", "description_courte": "[Description PDF]"}
    ],
    "poissons": [
      {"nom_commun": "[Espèce PDF]", "nom_scientifique": "[Nom latin PDF]", "statut": "[Statut PDF]", "description_courte": "[Description PDF]"}
    ],
    "mammiferes": [
      {"nom_commun": "[Espèce PDF]", "nom_scientifique": "[Nom latin PDF]", "statut": "[Statut PDF]", "description_courte": "[Description PDF]"}
    ],
    "oiseaux": [
      {"nom_commun": "[Espèce PDF]", "nom_scientifique": "[Nom latin PDF]", "statut": "[Statut PDF]", "description_courte": "[Description PDF]"}
    ],
    "insectes": [
      {"nom_commun": "[Espèce PDF]", "nom_scientifique": "[Nom latin PDF]", "statut": "[Statut PDF]", "description_courte": "[Description PDF]"}
    ],
    "reptiles": [
      {"nom_commun": "[Espèce PDF]", "nom_scientifique": "[Nom latin PDF]", "statut": "[Statut PDF]", "description_courte": "[Description PDF]"}
    ],
    "invertebres": [
      {"nom_commun": "[Espèce PDF]", "nom_scientifique": "[Nom latin PDF]", "statut": "[Statut PDF]", "description_courte": "[Description PDF]"}
    ],
    "sources": ["S_ID"]
  }
}
```

**RÈGLES CATÉGORISATION ESPÈCES :**
- **flore** : Arbres, arbustes, plantes (ex: Aulne glutineux, Saule blanc)
- **poissons** : Tous les poissons (ex: Saumon atlantique, Truite)
- **mammiferes** : Mammifères terrestres et aquatiques (ex: Loutre d'Europe, Castor)
- **oiseaux** : Tous les oiseaux (ex: Martin-pêcheur, Héron)
- **insectes** : Insectes et arthropodes (ex: Éphémères, Libellules)
- **reptiles** : Serpents, lézards, tortues
- **invertebres** : Mollusques, crustacés, vers

**EXTRACTION OBLIGATOIRE :**
- Extraire TOUTES les espèces mentionnées, même brièvement
- Ne jamais laisser une espèce dans la description sans la structurer
- Minimum : nom_commun, nom_scientifique (si disponible), statut, description_courte

## LIVRABLE FINAL
JSON valide, structure OPUS respectée, 9 dimensions complètes, importable directement.

**OBJECTIF** : Zéro erreur d'import, zéro correction manuelle post-traitement.

---
✅ **Version FINALE v4** - Structure technodiversité OPUS + 9 dimensions + références cohérentes + types sources variés