# Clôture du chantier « Audit des chemins d'écriture du registre de sol »

## Verdict : oui, l'étape peut passer en « Fait »

Vérifications faites à l'instant :

- **Recensement** : tous les fichiers qui touchent au registre sont couverts par l'inventaire du Coffre-fort (saisie, déplacement de prélèvement, journal des versions, lectures propriété, serveur MCP). Aucun point d'entrée non déclaré.
- **Lecture seule** : le hook de registre neutralise réellement l'enregistrement hors « J'analyse » (garde `readOnly` en tête des deux chemins d'écriture). Le serveur MCP n'expose que des outils de lecture.
- **Écriture chirurgicale** : le déplacement d'un prélèvement passe bien par la fonction dédiée, qui ne touche que les coordonnées.
- **Garde-fou base** : les deux déclencheurs (anti-destruction, journal des versions) sont actifs, les fonctions sont en mode privilégié avec les bons droits, et la règle d'accès à la table couvre désormais les marcheurs rattachés — comme la fonction d'enregistrement.
- **Journal** : 22 versions archivées, les baisses de nombre de prélèvements sont signalées en alerte dans la page d'audit.

## Un seul écart restant, cosmétique

L'inventaire affiche le chemin `supabase/functions/mcp-server/index.ts` alors que la fonction s'appelle `mcp`. Le régime déclaré (lecture seule) est correct ; seule l'étiquette est fausse.

## Correctif proposé avant de clore

- `src/lib/propriete/soilWritePaths.ts` : corriger le chemin de l'entrée `mcp-edge` en `supabase/functions/mcp/index.ts`.

Aucune migration, aucune autre modification.
