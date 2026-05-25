# Simplification du formulaire d'inscription /marches-du-vivant/connexion

## Objectif

Remplacer le bloc « Un peu de poésie » (3 selects + motivation) par 2 questions orientées projet, ajouter un consentement RGPD obligatoire, et alléger l'identité (suppression date de naissance).

---

## 1. Nouveau formulaire d'inscription (ordre)

**Identité essentielle**
- Email *
- Mot de passe *
- Prénom * / Nom *
- Ville
- Téléphone *(facultatif)*
- ~~Date de naissance~~ → supprimée

**Vos intentions de marche** (nouveau bloc, remplace « Un peu de poésie »)

> **Question 1 — Quels types de marches vous inspirent ?**
> *(Plusieurs réponses possibles — au moins une.)*
> 
> Cases à cocher :
> - 🌱 Agroécologique — sols, cultures, pratiques régénératives
> - 🌿 Éco-touristique — paysages, patrimoine, découverte territoriale
> - 🤝 Découverte de pratiques RSE / RSO
> - 🏢 Team-building entreprise
> - ✨ Autre  →  si coché, fait apparaître un champ texte « Précisez votre intention… »

> **Question 2 — Que recherchez-vous en priorité lors de vos prochaines marches du vivant ?**
> 
> Textarea libre, placeholder : *« Reconnecter une équipe au vivant, mesurer notre impact local, prendre le temps d'observer, nourrir une démarche RSE… »*

**Consentements** (bloc final, 2 cases)

1. ☐ **(obligatoire)** « Je consens à ce que mes réponses contribuent, de manière anonymisée, à mesurer l'impact des Marches du Vivant et à accélérer les démarches de transition environnementale. » *(lien vers politique de confidentialité)*
2. ☐ *(facultatif, signature d'âme)* « Je promets de lever les yeux de mon écran au moins une fois pendant la marche 🌿 »

Bouton désactivé tant que (1) n'est pas coché ET qu'aucun type de marche n'est sélectionné.

---

## 2. Migration base de données

Nouvelles colonnes sur `community_profiles` :

```text
types_marches_interets    text[]     NULL   -- ['agroecologique','eco_tourisme',...]
autre_type_marche         text       NULL   -- précision si 'autre' coché
recherche_prioritaire     text       NULL   -- réponse libre question 2
consentement_analyse_at   timestamptz NULL  -- horodatage consentement RGPD
```

- Mise à jour de la RPC `create_community_profile` pour accepter ces 4 nouveaux paramètres (tous optionnels, défauts NULL → rétrocompatibilité préservée pour les anciens appels).
- Aucun changement de RLS.

## 3. Code à modifier

- **`src/pages/MarchesDuVivantConnexion.tsx`** :
  - Retirer les constantes `KIGO_OPTIONS`, `SUPERPOUVOIR_OPTIONS`, `INTIMITE_OPTIONS` (et les states associés).
  - Retirer le state `dateNaissance` et son champ.
  - Ajouter states : `typesMarches: string[]`, `autreTypeMarche: string`, `recherchePrioritaire: string`, `consentementAnalyse: boolean` (`engagement` reste pour la case poétique facultative).
  - Construire le nouveau bloc UI (checkboxes + textarea conditionnelle + textarea libre + 2 cases consentement) en cohérence avec la charte glassmorphism émeraude existante.
  - Validation : bouton désactivé si `!consentementAnalyse || typesMarches.length === 0 || (typesMarches.includes('autre') && !autreTypeMarche.trim())`.

- **`src/hooks/useCommunityAuth.ts`** :
  - Étendre `SignUpData` avec les 4 nouveaux champs.
  - Passer ces champs à la RPC `create_community_profile` (qui aura les nouveaux paramètres).
  - Retirer `kigo_accueil`, `superpouvoir_sensoriel`, `niveau_intimite_vivant`, `date_naissance` du flux signup (les colonnes existantes restent en DB, non touchées — on cesse simplement de les peupler à l'inscription).

- **Aucune modification** des écrans admin / MonEspace qui exposent encore les anciens champs (Kigo etc.) — ils restent éditables après inscription via `MonEspaceSettings`.

## 4. Hors-scope (à valider si besoin séparément)

- Affichage de ces nouvelles réponses dans l'admin `CommunityProfilesAdmin` / `MarcheurEditSheet` (utile pour segmentation B2B — peut être un follow-up).
- Lien réel vers la politique de confidentialité (URL à fournir, sinon placeholder `#`).

---

## Résumé livrable

1 migration SQL (colonnes + RPC), 2 fichiers édités (`MarchesDuVivantConnexion.tsx`, `useCommunityAuth.ts`), zéro breaking change sur les inscriptions existantes.
