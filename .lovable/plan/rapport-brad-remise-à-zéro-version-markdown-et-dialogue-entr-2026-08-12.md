# Rapport BRAD : remise à zéro, version Markdown, et dialogue entre IA

Trois demandes du fournisseur, traitées dans l'ordre où elles débloquent son travail.

## 1. Remettre le compteur à ce matin 10 h

Aujourd'hui le rapport affiche des chiffres figés, écrits en dur (fenêtre « 72 dernières heures », relevé du 12/08 11 h). Ils ne bougeront plus jamais tout seuls.

Ce qui change :

- Le rapport devient **vivant** : il interroge la base à l'ouverture de la page et recalcule tout depuis une **date de départ**, fixée par défaut au **12 août 2026, 10 h 00 (Paris)**.
- Un bandeau en tête indique clairement : « Depuis le 12/08 10 h 00 — mis à jour il y a X min », avec un bouton **Rafraîchir**.
- Un sélecteur discret « Depuis… » (10 h aujourd'hui / 24 h / 72 h / date libre) permet à BRAD de rejouer la même lecture sur la fenêtre de son choix — utile s'il pousse un correctif à 15 h et veut voir l'effet immédiatement.
- Tous les indicateurs suivent : livraisons valides / refusées / vides, taux de signature, taux de trames utiles, cadence réelle, tableau des 3 sondes (dernier signal, livraisons, mesures), grandeurs reçues vs manquantes.
- Les **anomalies deviennent conditionnelles** : « batterie à 0 » ou « aucune humidité par horizon » ne s'affichent que si le constat tient encore sur la fenêtre choisie. Si BRAD corrige, l'anomalie passe d'elle-même en vert « corrigé — première trame conforme reçue à … ». C'est le point qui va l'impressionner : il voit son correctif validé en direct, sans nous écrire.
- La sonde d'essai (`test-probe-001`) reste rangée dans un repli « essais fournisseur ».

Sur le plan visuel, rien n'est perdu : mêmes anneaux animés, mêmes sismographes, on ajoute seulement l'horodatage vivant et le bloc « Corrigé depuis ».

## 2. Version Markdown, prête à coller dans Gemini

Deux boutons en tête du rapport :

- **Copier en Markdown** — un rapport complet et autoportant : contexte, fenêtre de lecture, tableau des sondes, grandeurs reçues et manquantes, anomalies avec exemples chiffrés, demandes à BRAD. Aucune tournure « écran » : c'est un document destiné à être lu par un modèle.
- **Télécharger .md** — même contenu, fichier `rapport-brad-lfdv-<date>.md`.

Le Markdown est généré à partir des **mêmes chiffres calculés** que l'affichage, jamais d'une copie parallèle : ce que BRAD lit à l'écran et ce que Gemini reçoit sont strictement identiques. En fin de document, un court bloc « Questions ouvertes à l'intégrateur » — c'est ce qui fait démarrer une conversation utile avec un modèle plutôt qu'un simple résumé.

## 3. Faire dialoguer Gemini et l'IA de Jardin

Sa meilleure idée, et elle mérite mieux qu'un copier-coller. Deux niveaux, livrés ensemble :

**Niveau 1 — le pont manuel (immédiat).** Un bouton **« Brief pour une autre IA »** produit un pack Markdown : le rapport + une consigne de rôle (« tu es l'ingénieur télémétrie côté fournisseur ») + les 4 questions auxquelles nous attendons une réponse. Il colle, Gemini répond, il nous renvoie le texte.

**Niveau 2 — la table ronde (le moment wahouh).** Un espace `/trust-in-frequence-vivant/table-ronde`, derrière le même mot de passe : deux colonnes, **l'IA de Jardin** (la nôtre, qui connaît le sol, les espèces et le registre de Jardin Monde DEVIAT) face à **la voix fournisseur** (la réponse de Gemini, collée ou saisie). Chaque tour, notre IA lit ce que l'autre a dit et répond avec les données réelles à l'appui — profondeurs manquantes, tensions mesurées, conséquence agronomique. Le fil se déroule comme une conversation, exportable en Markdown à la fin.

Concrètement pour lui : il pose une question à Gemini, colle la réponse, notre IA la reprend point par point avec les mesures en main. C'est une démonstration, pas une capture d'écran.

Une connexion automatique Gemini ↔ IA de Jardin (sans copier-coller) est possible dans un second temps ; elle demande une clé côté fournisseur ou de router Gemini par notre passerelle. À décider une fois la table ronde éprouvée.

## Détails techniques

- Nouveau hook `useTrustReport(since)` : agrégations sur `iot_webhook_deliveries` et `iot_mesures` (comptages par sonde, dernier `mesure_at`, présence par grandeur, détection `measures = {}`), via une RPC `SECURITY DEFINER` en lecture seule pour rester accessible sur la page publique protégée sans ouvrir la RLS.
- `src/lib/iot/trustReport.ts` : les constantes chiffrées sont remplacées par les seuils, libellés et le générateur Markdown ; le mot de passe et la structure éditoriale restent.
- `TrustInFrequenceVivant.tsx` : états chargement / vide / erreur, sélecteur de fenêtre, boutons Copier / Télécharger / Brief.
- Table ronde : réutilise l'edge `propriete-chat` (IA de Jardin) avec un contexte injecté = rapport courant + tours précédents. Aucune écriture en base, le fil vit dans la page.
- Aucun changement au webhook `iot-webhook-brad` ni au schéma des mesures.
