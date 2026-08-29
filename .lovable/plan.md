# Cinquième priorité « Résoudre un problème » — mise à niveau LFDV

Reprise dans LFDV de la 5e carte ajoutée dans le parcours public OFJ.

## État vérifié

- La question `priorite` vit dans le registre livré avec l'application (`src/config/onboarding/defaultSequence.ts`, séquence v4) : 4 options communes, plus des variantes pour Urbain balcon, Particulier grand, Entreprise terrain.
- La table `onboarding_flow_versions` existe mais **ne contient aucune ligne** : aucune version publiée n'écrase aujourd'hui la séquence livrée. Le risque décrit est donc futur — il se matérialisera à la première publication depuis `/admin/onboarding`.
- Le schéma de questions ne connaît que `single`, `multi`, `gallery`, `tiles`, `slider`, `surface` : **aucun type texte libre** n'existe encore.
- 8 exemples de jardin sont rattachés au type « Jardin net et structuré » ; **aucun** n'a de clé `problemes_frequents` dans `ai_profile`.
- Les contextes IA de la propriété (`useProprieteChatProviders`) exposent le portrait du site, le carnet « J'observe », le cortège… mais **rien du questionnaire d'accueil** : la priorité et le texte du problème n'atteignent aujourd'hui ni le chat, ni la clinique.

## Ce qui sera fait

### 1. La 5e carte dans le parcours de référence

- Ajouter l'option `resoudre_probleme` (« Résoudre un problème » / « Résoudre un problème sur le site » pour l'entreprise, précision « Plantation qui ne prend pas, sol, arbres, maladie… ») à la question `priorite` : liste commune **et** chacune des trois variantes de persona.
- Introduire un type de réponse texte libre dans le schéma, et le déclarer sur cette option (`answerId: priorite_probleme`, obligatoire quand la carte est choisie).
- La priorité `resoudre_probleme` n'est pas alimentaire : elle ne déclenche ni « période de récolte », ni « envies » (règle déjà en place, il suffit de ne pas l'ajouter aux priorités alimentaires).
- Passer la séquence livrée en version 5 pour tracer le changement.

### 2. Édition et relecture côté jardin

- L'éditeur « Portrait › Intention » sait déjà rejouer chaque question : lui ajouter la saisie texte, afin qu'un jardin déjà créé puisse choisir la carte et décrire son problème.
- Afficher la phrase du problème telle quelle dans la vue Intention, sans passer par un dictionnaire de libellés.

### 3. Exemples de jardin « net et structuré »

- Migration de données : enrichir `ai_profile` des 8 exemples du type « Jardin net et structuré » d'une clé `problemes_frequents` (haies qui ne reprennent pas, arbres âgés à soigner, sol tassé sous gazon), sans toucher aux autres clés.
- Faire apparaître ces problèmes fréquents dans l'encart de récompense affiché après le choix du modèle, pour que le message parle aussi de diagnostic.

### 4. Contextes IA — texte remonté brut

- Nouveau contexte « Intention du jardin » dans la console de contextes (chat propriété) : priorité, objectif à six mois, portrait, et `priorite_probleme` recopié **mot pour mot**, jamais traduit.
- Même remontée brute dans la narration de diagnostic et dans la clinique du jardin, où le texte sert d'amorce de conversation (« Vous nous avez dit : … »).

## Détails techniques

- `src/config/onboarding/schema.ts` : nouveau `kind: 'text'` (ou champ `followUp` sur une option) + type `AnswerValue` inchangé (chaîne).
- `src/config/onboarding/defaultSequence.ts` : option + variantes + `version: 5`.
- `src/components/propriete/portrait/IntentionQuestionEditor.tsx` et `PortraitIntention.tsx` : rendu et saisie du texte libre.
- Migration SQL : `UPDATE onboarding_garden_examples SET ai_profile = ai_profile || jsonb_build_object('problemes_frequents', …)` restreint au `type_id` de `structure`.
- `src/hooks/propriete/useProprieteChatProviders.ts` : provider `site.intention` alimenté par `usePropertyIntention`.

## Question ouverte

`onboarding_flow_versions` étant vide, faut-il en plus publier une première version en base à partir de la séquence v5 (pour que `/admin/onboarding` parte d'une base à jour), ou laisser la table vide tant que personne n'a publié ?
