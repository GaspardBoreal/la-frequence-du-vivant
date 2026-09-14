# Sécuriser l'entretien validé : de la récolte à la base de connaissance du jardin

Constat vérifié sur « Les Hortensias » : l'entretien `Jardin-Les-Hortensias-b8ff9d7f-0c26`
porte 13 cartes acceptées et le statut interne « récolte ». Trois faiblesses aujourd'hui :

1. Il n'existe aucun acte de validation de l'entretien lui-même. Rien ne dit « ce travail
   a été relu et arrêté avec Lina, tel jour ».
2. Les cartes acceptées restent librement modifiables et supprimables par toute personne
   autorisée à éditer le Portrait, sans trace, et l'entretien entier peut être effacé.
3. Le Tour de jardin n'utilise **rien** de l'entretien : ni les lignes rouges, ni les faits,
   ni le cap. Seule l'IA de Jardin les reçoit aujourd'hui.

## Ce que verra l'utilisateur

**Un acte de validation.** En haut de la fiche d'entretien, quand il ne reste plus de carte
en attente : « Valider l'entretien ». Une fenêtre récapitule ce qui va entrer dans le jardin
(nombre de cartes par registre, les lignes rouges en toutes lettres), demande le nom de la
personne avec qui la relecture a été faite (« Lina ») et la date. La validation est réservée
au propriétaire du jardin et à l'équipe Fréquence du Vivant.

**Un état clair et un cadenas.** Après validation, l'entretien porte un bandeau
« Base de connaissance du jardin · validée le 14 septembre 2026 avec Lina ». Les cartes
passent en lecture seule, avec une icône de cadenas. L'entretien ne peut plus être supprimé.

**Une correction possible, mais tracée.** Sur une carte verrouillée, un bouton « Corriger ».
Il demande un motif, enregistre une nouvelle version et conserve l'ancienne, consultable via
« Historique » sur la carte, avec auteur et date. Rien ne disparaît en silence.

**Une page « Base de connaissance » lisible.** En tête de l'onglet Entretiens, un encadré
regroupe ce qui est officiellement acquis, par registre, avec les lignes rouges mises en
avant, et la mention des outils qui s'en servent : IA de Jardin, Tour de jardin, Trois
premiers gestes. C'est la preuve visible que les décisions de Lina sont bien en vigueur.

**Le Tour de jardin tient compte de l'entretien.** Les lignes rouges deviennent une
interdiction absolue dans la proposition d'actions, les faits du lieu et le cap orientent les
actions. Chaque tour proposé affiche « Tour établi dans le respect de vos N lignes rouges ».

## Comment on sécurise réellement (détails techniques)

- **Schéma** : sur `propriete_entretiens`, ajout de `validated_at`, `validated_by`,
  `validated_with` (nom de la personne relectrice), `reopened_at`, `reopened_by`, et
  statut `valide`. Nouvelle table `propriete_entretien_extrait_versions`
  (extrait_id, titre, detail, verbatim, statut, motif, auteur, date) + GRANT + RLS calquée
  sur l'accès propriété, lecture seule côté client.
- **Verrou en base, pas seulement dans l'écran** : trigger `BEFORE UPDATE OR DELETE` sur
  `propriete_entretien_extraits` qui refuse toute écriture quand l'entretien parent est
  `valide`, sauf si l'écriture vient de la RPC de révision (drapeau de session). Trigger
  équivalent sur `propriete_entretiens` (pas de suppression, pas de nouvelle récolte sur un
  entretien validé). Un contournement par appel direct à l'API est ainsi impossible.
- **RPC `SECURITY DEFINER`** (`search_path = public`, exécution révoquée à `anon`) :
  - `valider_entretien(_entretien_id, _validated_with, _tenu_le)` — vérifie qu'aucune carte
    n'est encore « proposée », que l'appelant est propriétaire du jardin
    (`propriete_marcheurs` rôle `proprietaire`) ou administrateur (`check_is_admin_user`),
    puis fige l'entretien.
  - `reviser_extrait(_extrait_id, _titre, _detail, _motif)` — archive la version courante
    puis applique la correction, mêmes droits.
  - `rouvrir_entretien(_entretien_id, _motif)` — retour en arrière explicite et daté.
  - `get_propriete_connaissance(_propriete_id)` — **source unique** : renvoie uniquement les
    cartes acceptées d'entretiens **validés**, par registre.
- **Source unique côté lecture** : `useProprieteEntretienAcquis` et
  `useProprieteLignesRouges` passent par `get_propriete_connaissance`. Conséquence directe :
  l'IA de Jardin, le contexte 📎 `site.entretien` et les Trois premiers gestes
  (`useGardenGestures`) ne s'appuient plus sur des cartes d'un entretien encore en cours de
  relecture. `supabase/functions/propriete-chat/index.ts` fait de même côté serveur pour les
  lignes rouges système.
- **Tour de jardin** : `supabase/functions/propriete-tour-suggest/index.ts` lit
  `get_propriete_connaissance` et ajoute au contexte `entretien: { lignes_rouges, faits,
  cap }`, avec une règle système en tête du prompt (« interdiction absolue, une action
  contraire à une ligne rouge est un échec »). Contrôle serveur après génération : toute
  action dont le titre ou le détail contient un terme interdit dérivé des lignes rouges
  validées est écartée avant enregistrement, et le nombre d'actions écartées est renvoyé.
  Ce filtre est un garde-fou lexical, pas une garantie sémantique — la règle de prompt reste
  la protection principale.
- **Front** : `PortraitEntretiens.tsx` (bandeau d'état, cadenas, fenêtre de validation,
  historique de carte), nouveau `ConnaissanceJardinCard.tsx` en tête de l'onglet,
  `useProprieteEntretiens.ts` étendu (valider, réviser, rouvrir, historique).

## Vérification

- Un entretien validé : tentative de modification directe d'une carte via l'API → refus par
  la base ; suppression de l'entretien → refus.
- Une révision : ancienne valeur retrouvée dans l'historique avec motif et auteur.
- Un nouveau Tour de jardin sur Les Hortensias : les lignes rouges validées apparaissent dans
  le contexte envoyé, et aucune action proposée ne les contredit.
- Les cartes d'un entretien non encore validé n'apparaissent ni dans le contexte de l'IA de
  Jardin ni dans les gestes.
