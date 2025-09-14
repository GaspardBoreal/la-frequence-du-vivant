# POST-VALIDATION PDF → JSON (NETTOYAGE PYTHON → JSON)

Objectif: garantir un JSON 100% valide après extraction, en appliquant automatiquement les conversions syntaxiques courantes issues d'environnements Python.

Règles de nettoyage automatiques (sans invention):
- Remplacer les tokens Python hors chaînes: None → null, True → true, False → false
- Supprimer les virgules finales avant } et ]
- Convertir les chaînes entre guillemets simples en guillemets doubles quand elles constituent des valeurs: `: 'val'` → `: "val"`, `[ 'a', 'b' ]` → `[ "a", "b" ]`
- Normaliser les guillemets typographiques: “ ” → ", ‘ ’ → '
- Retirer les commentaires (#, //) et lignes orphelines
- Interdits absolus: NaN, Infinity, dates non ISO sans guillemets

Procédure obligatoire:
1) Appliquer le nettoyage ci-dessus, sans altérer le contenu sémantique
2) Vérifier JSON.parse(...) sans erreur
3) Vérifier l'absence de `data` (doit être `donnees`) et de clés non conformes au schéma
4) Ajouter une note de transformation dans `metadata.transformation_notes` si des corrections syntaxiques ont été nécessaires

Exemples de corrections:
- `"budget_estime": None` → `"budget_estime": null`
- `"autonomie_energetique": True` → `"autonomie_energetique": true`
- `"tags": ['eau','dordogne']` → `"tags": ["eau", "dordogne"]`
- `{"a":1,}` → `{"a":1}`

Sortie attendue: JSON valide, strictement compatible avec OpusImportSchema, sans aucune invention de données.