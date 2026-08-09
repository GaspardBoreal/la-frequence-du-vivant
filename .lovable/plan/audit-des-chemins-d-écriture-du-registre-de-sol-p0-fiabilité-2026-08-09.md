# Audit des chemins d'écriture du registre de sol (P0 — Fiabilité)

Objectif : garantir qu'aucun écran ne peut plus effacer un registre de prélèvements, et rendre cette garantie **vérifiable en direct** depuis une page d'audit dans l'application.

## Ce que révèle le recensement

Neuf écrans lisent le registre. Un seul est censé écrire.

```text
ÉCRITURE AUTORISÉE
  J'analyse (TabAnalyze)            saisie complète, garde-fou serveur actif

LECTURE SEULE — conforme
  J'identifie · La palette · La synthèse · Le chantier · Contextes IA

ÉCRITURE NON DÉCLARÉE — à corriger
  Carte des zones (Palette)         déplacement d'un prélèvement
  Registre des ouvrages (Atelier)   déplacement d'un prélèvement
  Studio palette / Scénographe      déplacement d'un prélèvement
```

Ces trois écrans passent par le même déplacement de point. Il réécrit aujourd'hui **tout le registre** (relu juste avant, puis renvoyé en entier) alors qu'il ne devrait toucher que deux coordonnées. Le garde-fou base bloque bien l'effacement d'une valeur remplie, mais rien n'empêche structurellement une régression de repasser par ce chemin large.

Deuxième écart constaté : la règle d'accès directe à la table n'autorise l'écriture qu'au marcheur principal, alors que la fonction d'enregistrement l'autorise aussi aux marcheurs rattachés. Deux règles différentes pour la même donnée — à aligner.

## Ce qu'on met en place

**1. Un déplacement de prélèvement chirurgical**
Nouvelle fonction serveur qui ne modifie que la latitude et la longitude d'un prélèvement identifié. Elle ne peut ni supprimer un point, ni vider un champ, ni toucher aux autres blocs du registre — quelle que soit l'erreur côté interface. Les trois écrans concernés basculent dessus.

**2. Une page d'audit « Coffre-fort du registre » (admin)**
Accessible depuis le hub Outils admin. Elle vérifie en direct, à chaque ouverture :

- présence et activité des deux verrous en base (journal des versions, garde-fou anti-destruction) ;
- existence des deux fonctions d'écriture et cohérence de leurs droits ;
- alignement entre la règle d'accès à la table et la règle de la fonction ;
- inventaire des points d'entrée applicatifs avec leur régime (lecture seule / écriture protégée / écriture chirurgicale) ;
- dernières écritures enregistrées dans le journal des versions, propriété par propriété, avec l'évolution du nombre de prélèvements — une baisse est signalée en alerte.

Chaque ligne affiche un verdict lisible : conforme, à surveiller, non protégé. Un test à blanc peut être lancé sur une propriété choisie : il tente une écriture destructive volontaire et attend un refus — si l'écriture passe, le verrou est déclaré défaillant.

**3. Le rendu**
Sobriété informationnelle : un bandeau de verdict global, puis les sections. Tokens sémantiques uniquement, lisible en Papier Crème et en Forêt Émeraude, mobile-first (375 px) et desktop. Squelettes de chargement, état vide explicite, erreurs affichées telles quelles avec le message serveur. Micro-animations discrètes sur l'apparition des verdicts et le passage d'un verrou en « vérifié ».

## Détails techniques

- Migration : `public.move_propriete_soil_sample(p_propriete_id uuid, p_sample_id text, p_lat numeric, p_lng numeric)` — SECURITY DEFINER, même contrôle d'accès que `upsert_propriete_soil`, patch `jsonb_set` limité à l'élément d'`id` correspondant, jamais de `p_allow_destructive`. `GRANT EXECUTE ... TO authenticated`.
- Migration : alignement de la policy `soil_write` sur les marcheurs rattachés (`propriete_marcheurs`), comme le fait déjà la RPC.
- Migration : `public.audit_propriete_soil_guards()` — SECURITY DEFINER réservée aux admins (`check_is_admin_user`), renvoie un JSON décrivant triggers, fonctions, policies et grants observés dans `pg_trigger` / `pg_proc` / `pg_policies`.
- `src/hooks/propriete/useSoilSamples.ts` : `moveSample` appelle la nouvelle RPC (suppression de la relecture + réécriture complète). Optimistic update conservé.
- Nouveau `src/hooks/propriete/useSoilGuardAudit.ts` : appel de l'RPC d'audit + lecture agrégée de `propriete_soil_diagnostics_history`.
- Nouveau `src/lib/propriete/soilWritePaths.ts` : inventaire déclaratif des points d'entrée (fichier, écran, régime attendu), consommé par la page d'audit.
- Nouvelle page `src/pages/AdminSoilRegistryAudit.tsx` + route protégée `/admin/outils/registre-sol` dans `src/App.tsx` (via `lazyWithRetry`), tuile ajoutée dans `AdminOutilsHub`.
- Composants : `SoilGuardVerdictBanner`, `SoilGuardChecklist`, `SoilWritePathsTable`, `SoilHistoryPulse` sous `src/components/admin/soil-audit/`.
- Test à blanc : appel de `upsert_propriete_soil` avec un registre amputé et `p_allow_destructive: false` sur une propriété choisie ; succès attendu = exception serveur. Aucune donnée n'est modifiée en cas de refus.
- Aucune URL publique modifiée.
