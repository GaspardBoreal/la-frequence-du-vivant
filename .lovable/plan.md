# Corriger un faux nom FR pour "Broad-bordered Bee Hawkmoth"

## Constat
L'app affiche "Agrion (ou Demoiselle)" pour `Hemaris fuciformis` (Broad-bordered Bee Hawkmoth). C'est une **hallucination** : un sphinx ne peut pas s'appeler "Agrion" (libellule). Le bon nom FR est **Sphinx fuciforme** (parfois "Sphinx gazé").

## Pourquoi cela arrive
L'architecture des noms FR repose sur 3 couches :

```text
<SpeciesName />
   └─ useFrenchSpeciesNamesAuto
        ├─ 1. Lit la table species_translations (cache partagé)
        └─ 2. Si manquant → edge function translate-species (LLM)
             └─ écrit le résultat dans species_translations
```

Le mauvais nom est donc figé dans la table `species_translations` (probablement écrit par le LLM lors d'une première résolution ratée). Tant qu'il y est, **tous les utilisateurs voient "Agrion" pour ce sphinx**, et le résolveur ne réinterroge plus le LLM.

## Ce qu'il faut faire — 3 niveaux

### 1. Correction immédiate (la ligne fautive)
Mettre à jour la ligne `Hemaris fuciformis` dans `species_translations` :
- `common_name_fr` → "Sphinx fuciforme"
- `source` → "manual"
- `confidence` → "high"

Effet : tout l'app affiche immédiatement le bon nom (le cache TanStack Query expire sous 24 h, les nouveaux mounts voient déjà la bonne valeur).

### 2. Audit ciblé des hallucinations voisines
Lister en base toutes les lignes où :
- `source` n'est pas `manual` / `local`
- ET `common_name_fr` contient un terme sans rapport taxonomique évident (ex. "Agrion", "Demoiselle", "Sphinx", "Mésange"…) appliqué à un genre incohérent.

Au minimum, repasser sur tout le genre `Hemaris` et la famille `Sphingidae` pour vérifier qu'aucun autre sphinx n'a hérité d'un nom de libellule.

### 3. Durcir l'edge function `translate-species`
Pour éviter que ça se reproduise :
- Renforcer le prompt : interdire d'inventer un nom vernaculaire si incertain ; en cas de doute renvoyer le nom scientifique tel quel.
- Stocker `confidence: 'low'` quand le LLM n'est pas sûr, et **ne pas afficher** les `low` (fallback nom scientifique).
- Optionnel : valider la cohérence taxonomique ordre/famille (ex. un Lepidoptera ne peut pas s'appeler "Agrion").

## Pour le user (réponse directe à ta question)
Pour qu'un nom FR soit affiché, il faut une ligne dans `species_translations` reliant le nom scientifique au nom FR. Mais ici, "Agrion" est faux — la bonne action n'est pas de **forcer** ce nom, c'est de **remplacer** la ligne fautive par "Sphinx fuciforme", puis durcir le LLM pour qu'il n'hallucine plus.

## Question avant d'implémenter
Confirme-moi : tu veux bien le **bon** nom FR ("Sphinx fuciforme"), pas littéralement "Agrion (ou Demoiselle)" ? Si oui je passe en build et je corrige la ligne + je propose le durcissement du prompt.