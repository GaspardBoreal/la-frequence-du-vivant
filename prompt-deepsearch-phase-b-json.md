# PROMPT DEEPSEARCH PHASE B - TRANSFORMATION PDF → JSON

## MISSION PRINCIPALE

Transformer les données validées du rapport PDF DEEPSEARCH Phase A en JSON structuré conforme au template d'import OPUS, avec zéro invention et traçabilité complète.

## CONTEXTE D'EXÉCUTION

- **Source unique** : Rapport PDF DEEPSEARCH Phase A validé par contrôle humain
- **Output attendu** : JSON conforme au schéma OpusImportSchema
- **Principe fondamental** : AUCUNE invention - extraction exclusive des données PDF
- **Validation** : Correspondance exacte entre PDF source et JSON produit

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

## RÈGLES DE SYNTAXE JSON STRICTE (OBLIGATOIRES)
- Utiliser exclusivement des guillemets doubles pour les clés et les chaînes: "..."
- Valeurs booléennes et nulles: true, false, null (jamais True, False, None)
- Aucune virgule finale avant } ou ]
- Aucune ligne de commentaire (#, //) ni texte hors structure JSON
- Aucune chaîne entre guillemets simples (convertir en guillemets doubles)
- Aucune valeur non-JSON: pas de NaN, Infinity, dates non ISO sans guillemets, etc.
- Clés exactes du schéma: pas d'inventions ni renommages

Exemple minimal valide:
```json
{
  "dimensions": {},
  "fables": [],
  "sources": [],
  "metadata": {
    "territory_name": "...",
    "gps_point": "...",
    "sourcing_date": "2025-01-10",
    "import_date": "2025-01-10"
  }
}
```

Checklist de validation rapide:
- [ ] Aucune occurrence de None/True/False
- [ ] Aucune virgule finale
- [ ] Toutes les clés et chaînes en guillemets doubles
- [ ] JSON.parse(...) passe sans erreur

## MAPPING PDF → JSON OBLIGATOIRE

### 1. SYNTHÈSE EXÉCUTIVE → Métadonnées JSON
**Section PDF** : "1. SYNTHÈSE EXÉCUTIVE"
**Destination JSON** : `metadata`
```json
{
  "metadata": {
    "gps_point": "[extrait GPS exact du PDF]",
    "territory_name": "[nom territoire du PDF]",
    "data_completeness": "[score complétude PDF]",
    "sourcing_date": "2025-01-10",
    "import_date": "2025-01-10",
    "ai_model": "deepsearch-phase-b",
    "validation_level": "human_validated_pdf"
  }
}
```

### 2. CONTEXTE HYDROLOGIQUE → Dimension Hydrologique
**Section PDF** : "2. CONTEXTE HYDROLOGIQUE QUANTIFIÉ"
**Destination JSON** : `dimensions.hydrologique`
```json
{
  "dimensions": {
    "hydrologique": {
      "description": "[synthèse section 2 PDF]",
      "data": {
        "niveaux_eau": "[données PDF section 2.1]",
        "debits": "[données PDF section 2.2]",
        "qualite_eau": "[données PDF section 2.3]",
        "station_reference": "[station PDF section 2.4]"
      }
    }
  }
}
```

### 3. BIODIVERSITÉ → Dimension Espèces
**Section PDF** : "3. BIODIVERSITÉ CARACTÉRISTIQUE - 5 ESPÈCES"
**Destination JSON** : `dimensions.especes`
```json
{
  "dimensions": {
    "especes": {
      "description": "[synthèse 5 espèces PDF]",
      "data": {
        "espece_1": "[fiche complète espèce 1 PDF]",
        "espece_2": "[fiche complète espèce 2 PDF]",
        "espece_3": "[fiche complète espèce 3 PDF]",
        "espece_4": "[fiche complète espèce 4 PDF]",
        "espece_5": "[fiche complète espèce 5 PDF]",
        "bio_indicateur": "[espèce bio-indicatrice identifiée PDF]"
      }
    }
  }
}
```

### 4. VOCABULAIRE LOCAL → Dimension Vocabulaire
**Section PDF** : "4. MÉMOIRE TERRITORIALE ET VOCABULAIRE LOCAL"
**Destination JSON** : `dimensions.vocabulaire`
```json
{
  "dimensions": {
    "vocabulaire": {
      "description": "[synthèse mémoire territoriale PDF]",
      "data": {
        "termes_locaux": "[termes hydrologiques PDF section 4.1]",
        "phenomenes": "[expressions phénomènes PDF section 4.2]",
        "pratiques": "[pratiques traditionnelles PDF section 4.3]",
        "etymologie": "[racines linguistiques PDF section 4.4]"
      }
    }
  }
}
```

### 5. EMPREINTES HUMAINES → Dimension Infrastructure
**Section PDF** : "5. EMPREINTES HUMAINES STRATIFIÉES - 3 ÉLÉMENTS"
**Destination JSON** : `dimensions.infrastructure`
```json
{
  "dimensions": {
    "infrastructure": {
      "description": "[synthèse 3 empreintes PDF]",
      "data": {
        "hydraulique_majeure": "[infrastructure hydraulique PDF section 5.1]",
        "developpement_recent": "[développement <10 ans PDF section 5.2]",
        "vestige_historique": "[vestige significatif PDF section 5.3]",
        "analyse_diachronique": "[évolution temporelle PDF section 5.4]"
      }
    }
  }
}
```

### 6. PROSPECTIVE → Dimensions Climate + Agroécologie + Activités
**Section PDF** : "6. PROSPECTIVE TERRITORIALE 2035-2045"

#### 6.1 Moteurs Climatiques → Dimension Climate
```json
{
  "dimensions": {
    "climate": {
      "description": "[synthèse moteurs climatiques PDF section 6.1]",
      "data": {
        "temperature_evolution": "[projections température PDF]",
        "precipitation_changes": "[évolution précipitations PDF]",
        "extreme_events": "[événements extrêmes PDF]",
        "hydraulic_impacts": "[impacts hydrauliques PDF]"
      }
    }
  }
}
```

#### 6.2 Leviers Agroécologiques → Dimension Agroécologie
```json
{
  "dimensions": {
    "agroecologie": {
      "description": "[synthèse leviers agroéco PDF section 6.2]",
      "data": {
        "pratiques_adaptatives": "[pratiques PDF section 6.2.1]",
        "corridors_ecologiques": "[corridors PDF section 6.2.2]",
        "gestion_eau": "[gestion eau PDF section 6.2.3]",
        "resilience_territoriale": "[résilience PDF section 6.2.4]"
      }
    }
  }
}
```

#### 6.3 Nouvelles Activités → Dimension Activités
```json
{
  "dimensions": {
    "activites": {
      "description": "[synthèse nouvelles activités PDF section 6.3]",
      "data": {
        "economie_circulaire": "[économie circulaire PDF]",
        "services_ecosystemiques": "[services écosystémiques PDF]",
        "innovation_locale": "[innovations locales PDF]",
        "gouvernance_participative": "[gouvernance PDF]"
      }
    }
  }
}
```

### 7. FONCTIONNALITÉS IA → Dimension Context
**Section PDF** : "7. IA RIVIÈRE DORDOGNE - 5 FONCTIONNALITÉS"
**Destination JSON** : `dimensions.context`
```json
{
  "dimensions": {
    "context": {
      "description": "[synthèse 5 fonctionnalités IA PDF]",
      "data": {
        "decision_collective": "[fonctionnalité 1 PDF]",
        "alertes_predictives": "[fonctionnalité 2 PDF]",
        "mediation_geopoetique": "[fonctionnalité 3 PDF]",
        "optimisation_agroeco": "[fonctionnalité 4 PDF]",
        "reseaux_collaboratifs": "[fonctionnalité 5 PDF]"
      }
    }
  }
}
```

### 8. TECHNODIVERSITÉ → Dimension Technodiversité
**Section PDF** : "8. TECHNODIVERSITÉ STRATIFIÉE - 9 SOLUTIONS"
**Destination JSON** : `dimensions.technodiversite`
```json
{
  "dimensions": {
    "technodiversite": {
      "description": "[synthèse 9 solutions techno PDF]",
      "data": {
        "trl_7_9": "[3 solutions matures PDF section 8.1]",
        "trl_4_6": "[3 solutions développement PDF section 8.2]",
        "trl_1_3": "[3 solutions recherche PDF section 8.3]",
        "integration_territoriale": "[intégration locale PDF section 8.4]"
      }
    }
  }
}
```

## SOURCES ET TRAÇABILITÉ

### Extraction sources PDF → JSON
**Section PDF** : Toutes références bibliographiques présentes
**Destination JSON** : `sources`
```json
{
  "sources": [
    {
      "id": "source_1",
      "title": "[titre exact PDF]",
      "url": "[URL exacte PDF]",
      "type": "[type source PDF]",
      "author": "[auteur PDF]",
      "publication_date": "[date PDF]",
      "access_date": "[date accès PDF]",
      "reliability": "[niveau fiabilité PDF 1-5]",
      "summary": "[résumé source PDF]"
    }
  ]
}
```

### Fables narratives
**Section PDF** : Éléments narratifs et poétiques présents
**Destination JSON** : `fables`
```json
{
  "fables": [
    {
      "id": "fable_territoire",
      "title": "[titre fable PDF]",
      "content": "[contenu narratif PDF]",
      "variations": {
        "courte": "[version courte PDF]",
        "longue": "[version longue PDF]",
        "poetique": "[version poétique PDF]"
      }
    }
  ]
}
```

## INSTRUCTIONS DE TRANSFORMATION

### Étape 1 - Analyse PDF complète
1. **Lecture intégrale** du PDF DEEPSEARCH Phase A
2. **Identification sections** selon structure attendue (8 sections)
3. **Extraction données** par section avec références page
4. **Validation complétude** : vérifier présence toutes dimensions

### Étape 2 - Mapping systématique
1. **Correspondance exacte** : chaque section PDF → dimension JSON
2. **Préservation données** : copie fidèle sans interprétation
3. **Structure JSON** : respect schéma OpusImportSchema
4. **Métadonnées enrichies** : ajout contexte transformation

### Étape 3 - Validation croisée
1. **Cohérence territoriale** : vérifier GPS point cohérent
2. **Cohérence temporelle** : vérifier période 2022-2025
3. **Cohérence sources** : vérifier niveau fiabilité ≥ L1-L2
4. **Complétude JSON** : vérifier toutes dimensions populées

### Étape 4 - Contrôles qualité
1. **Traçabilité** : chaque donnée référence sa section PDF
2. **Fidélité** : aucune invention, aucune extrapolation
3. **Structure** : JSON conforme schéma validation
4. **Sources** : toutes références PDF préservées

## TEMPLATE JSON DE SORTIE

```json
{
  "dimensions": {
    "hydrologique": { /* Données section 2 PDF */ },
    "especes": { /* Données section 3 PDF */ },
    "vocabulaire": { /* Données section 4 PDF */ },
    "infrastructure": { /* Données section 5 PDF */ },
    "climate": { /* Données section 6.1 PDF */ },
    "agroecologie": { /* Données section 6.2 PDF */ },
    "activites": { /* Données section 6.3 PDF */ },
    "context": { /* Données section 7 PDF */ },
    "technodiversite": { /* Données section 8 PDF */ }
  },
  "fables": [
    { /* Éléments narratifs extraits PDF */ }
  ],
  "sources": [
    { /* Toutes sources référencées PDF */ }
  ],
  "metadata": {
    "gps_point": "/* GPS exact PDF */",
    "territory_name": "/* Nom territoire PDF */",
    "data_completeness": "/* Score complétude PDF */",
    "sourcing_date": "2025-01-10",
    "import_date": "2025-01-10",
    "ai_model": "deepsearch-phase-b",
    "validation_level": "human_validated_pdf",
    "pdf_source": "/* Référence PDF Phase A */",
    "transformation_notes": "/* Notes transformation */"
  }
}
```

## RÈGLES ABSOLUES - PHASE B

### ❌ INTERDICTIONS STRICTES
- **AUCUNE invention** de données non présentes dans le PDF
- **AUCUNE extrapolation** au-delà des données PDF
- **AUCUNE modification** des données validées PDF
- **AUCUNE omission** de sources référencées PDF

### ✅ OBLIGATIONS STRICTES
- **EXTRACTION pure** des données PDF uniquement
- **TRAÇABILITÉ complète** : référence section PDF pour chaque donnée
- **PRÉSERVATION fidèle** des sources et références
- **RESPECT schéma** OpusImportSchema sans dérogation

### 🔍 CONTRÔLES QUALITÉ OBLIGATOIRES
- **Correspondance 1:1** : chaque section PDF → dimension JSON
- **Complétude vérifiée** : 9 dimensions obligatoires populées
- **Sources préservées** : toutes références PDF maintenues
- **Cohérence territoriale** : GPS point et périmètre respectés

## GESTION DES CAS PARTICULIERS

### PDF incomplet ou données manquantes
- **Signalement explicite** des sections PDF manquantes ou incomplètes
- **Dimensions partielles** : populer avec données disponibles uniquement
- **Notes transformation** : documenter limitations dans metadata
- **Pas d'invention** : laisser vide plutôt qu'inventer

### Données PDF ambiguës
- **Extraction littérale** : copier texte exact PDF sans interprétation
- **Référence section** : indiquer page et section PDF source
- **Note explicative** : ajouter contexte dans transformation_notes
- **Validation ultérieure** : marquer pour révision humaine

### Sources PDF multiples
- **Préservation intégrale** : toutes sources PDF → array sources JSON
- **Hiérarchisation maintenue** : respecter niveaux fiabilité PDF
- **Déduplication intelligente** : fusionner sources identiques
- **Traçabilité sections** : indiquer quelles sources pour quelles dimensions

## LIVRABLE ATTENDU

### Format de sortie
- **Fichier JSON unique** conforme OpusImportSchema
- **Validation schéma** : JSON valide et importable
- **Documentation transformation** : notes méthodologiques
- **Rapport correspondance** : mapping PDF → JSON détaillé

### Qualité requise
- **Fidélité maximale** aux données PDF validées
- **Structure parfaite** pour import OPUS direct
- **Traçabilité complète** PDF → JSON
- **Zéro invention** : extraction pure uniquement

---

**OBJECTIF FINAL** : Transformer le rapport PDF DEEPSEARCH Phase A validé par contrôle humain en JSON structuré directement importable dans OPUS, avec zéro perte de données et traçabilité absolue.