# Le registre des prélèvements est-il définitivement à l'abri ?

## Où nous en sommes (vérifié à l'instant)

La fiche sol de « Jardin Monde DEVIAT » contient bien **7 prélèvements, tous les 7 géolocalisés**, dernière écriture à 10 h 41 (Paris) — votre repositionnement est enregistré.

Les trois verrous posés hier sont actifs et vérifiés en base :

- **Un seul scribe** — seul l'onglet « J'analyse » écrit ; « J'identifie », « La palette », « La synthèse », « Le Chantier » et les fournisseurs de contexte du chatbot sont en lecture seule.
- **Sauvegarde uniquement après saisie réelle** — plus aucune écriture au simple chargement ou re-rendu.
- **Garde-fou en base** — le déclencheur `guard_propriete_soil_samples` refuse toute écriture qui ferait perdre des prélèvements ou des valeurs, sauf suppression explicitement demandée.
- **Boîte noire** — le déclencheur `log_propriete_soil_history` archive chaque version du registre.

Autrement dit : le scénario exact de ce matin (un onglet passif réécrivant une version périmée) **ne peut plus se produire**, et même s'il se produisait, la base le rejetterait.

## Ce qu'il reste à faire pour fermer complètement le sujet

### 1. Le dernier écrivain non encadré

Le déplacement d'un point sur la carte passe par un second chemin d'écriture (`useSoilSamples.moveSample`, utilisé par la Palette, le registre des ouvrages et la carte des zones). Il réécrit le registre entier à partir du cache. Le garde-fou en base le protège aujourd'hui, mais il vaut mieux qu'il **n'écrive que le point déplacé** plutôt que tout le registre, et qu'il relise la version serveur juste avant d'écrire.

### 2. Le registre vide par défaut

Quand aucune fiche n'existe encore, l'application propose un registre fictif A · B · C. Si une lecture échoue au mauvais moment, ce trio pourrait servir de base à une écriture. À rendre **non enregistrable** : un registre par défaut ne doit jamais partir en base tant que l'utilisateur n'a rien saisi.

### 3. Pouvoir restaurer soi-même

L'historique existe mais n'est pas consultable dans l'application. Ajout d'un panneau discret dans « J'analyse » : liste des versions (date, auteur, nombre de prélèvements, nombre de valeurs), aperçu, et bouton **Restaurer cette version**. Un incident redevient réparable en 30 secondes, sans intervention technique.

### 4. Une preuve papier automatique

Un rappel dans « J'analyse » lorsque le registre a changé depuis le dernier carnet imprimé, pour garder une trace hors ligne à jour.

## Portée

Uniquement le registre des prélèvements et ses chemins d'écriture. Aucune autre section, aucune autre propriété.

## Détails techniques

- `src/hooks/propriete/useSoilSamples.ts` : `moveSample` refetch la ligne avant l'upsert et n'applique le patch `lat`/`lng` que sur l'échantillon ciblé ; `p_allow_destructive: false` explicite.
- `src/hooks/propriete/usePropertySoil.ts` : marquer le fallback `EMPTY` comme non persistable (garde `hasServerRow` bloquant `persist` tant que la requête n'a pas répondu).
- Nouveau `SoilHistoryPanel` dans « J'analyse », lisant `propriete_soil_diagnostics_history` (RLS déjà en place) ; restauration via `upsert_propriete_soil` avec `p_allow_destructive: true` sur action explicite.
- Aucune migration nécessaire pour les points 1, 2 et 4 ; le point 3 peut nécessiter une RPC `restore_propriete_soil_version` si l'on veut journaliser la restauration.
