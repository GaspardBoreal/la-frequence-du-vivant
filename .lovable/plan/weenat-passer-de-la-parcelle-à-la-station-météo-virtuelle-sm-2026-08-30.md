# Weenat : passer de la parcelle à la Station Météo Virtuelle (SMV)

## Ce que dit Weenat, traduit dans notre modèle

La SMV n'est plus une option cochée sur une parcelle : c'est un **capteur virtuel à part entière**, avec son propre numéro de série et sa propre page de données — donc, côté API, un objet de la liste des **appareils** (`/v3/devices`), pas de la liste des **parcelles** (`/v3/plots`).

## Ce que montre notre base aujourd'hui (vérifié)

- Le capteur « Station Météo Virtuelle » de « Jardin Monde DEVIAT » est rattaché à la **parcelle 122193** (`external_kind = plot`, `serial_number = plot-122193`).
- Les mesures reçues ne contiennent que **rayonnement solaire** et **point de rosée** (156 points chacun), jusqu'au 29/08 21 h.
- Le cron horaire tourne bien (dernière exécution 09 h 07 aujourd'hui, succès) : ce n'est pas un problème de planification.

Autrement dit, on interroge le bon compte mais le mauvais objet : l'endpoint parcelle ne renvoie que les grandeurs agrégées, alors que la SMV — l'appareil — porte température, pluie, humidité, vent, ETP, VPD.

## Correction proposée

1. **Retrouver la SMV dans la liste des appareils** : lancer la découverte Weenat sur ce raccordement et identifier l'appareil de modèle SMV (numéro de série propre, position sur la carte).
2. **Rebasculer le capteur existant** sur cet appareil : `external_kind` passe de `plot` à `device`, `external_id` prend l'identifiant de la SMV, le numéro de série devient celui donné par Weenat. L'historique déjà collecté est conservé (même ligne capteur, mêmes mesures).
3. **Tirage de contrôle sur 7 jours** et lecture des grandeurs réellement reçues ; complément du tableau de correspondance des métriques si Weenat renvoie des clés non encore traduites (par ex. ensoleillement, pluie prévisionnelle).
4. **Interface de rattachement plus juste** : dans la carte « Raccordements fournisseurs », la découverte n'affiche aujourd'hui que les parcelles et le libellé « Météo Vision activée / non activée », vocabulaire abandonné par Weenat. À remplacer par une liste unique **Appareils et stations virtuelles** (les SMV mises en avant), la parcelle ne servant plus que de repère géographique.
5. **Garde-fou** : si un capteur Weenat rattaché à une parcelle ne renvoie que deux grandeurs alors que son type en déclare neuf, l'afficher dans la fiche capteur comme « rattachement à revoir » plutôt que comme panne.

## Détails techniques

- `supabase/functions/iot-weenat-discover` renvoie déjà les appareils ; c'est l'interface qui les filtre (`ProviderIntegrationsPanel.tsx` ne garde que `external_kind === 'plot'`). Correction côté affichage, plus champ « modèle » visible.
- `iot-pull-weenat` gère déjà les deux endpoints selon `external_kind` : aucune modification de la collecte n'est nécessaire, seul le capteur change de cible.
- Mise à jour du capteur `f40bff6f…` par une écriture ciblée (`external_kind`, `external_id`, `serial_number`) — pas de migration de schéma.
- Tableau des métriques (`supabase/functions/_shared/weenat.ts`) complété seulement si la SMV renvoie des clés inconnues au tirage de contrôle.
