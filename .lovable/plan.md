## Objectif

Transformer le bloc Narration de l'Étape 3 en un vrai **mode « Narration automatique »** : à l'ouverture, le texte est préremplit à partir du profil de la propriété, et l'IA propose **deux variantes de formulation** côte à côte, que le propriétaire choisit, compare et adopte.

## État actuel (vérifié)

- `NarrativeBlock.tsx` reçoit déjà un `aiContext` (cortège relevé, 8 pôles, sol Étape 2, ICG/fiabilité, commune, nb d'espèces) et un bouton « Générer la narration » qui produit **un seul** texte, à adopter ou ajouter à la suite.
- L'edge function `propriete-diagnostic-narration` renvoie `{ narration }` (une seule sortie, modèle `google/gemini-3.6-flash`).
- Le champ persistant est `flora_conclusion` dans `propriete_flora_diagnostics` (auto-save debounce 1,5 s).

## Ce qui est construit

### 1. Deux variantes de formulation

L'edge function renvoie désormais **deux textes** issus du même jeu de données, avec deux registres distincts :

- **Variante A — Agronomique** : précise, factuelle, orientée décision (chiffres, ICG, préconisations prudentes). Registre attendu par un paysagiste ou un technicien.
- **Variante B — Sensible** : narrative et incarnée, dans l'esprit de la Fréquence du Vivant (le site raconté par sa végétation), sans perdre l'exactitude des données.

Les deux partent du même contexte, donc aucune divergence factuelle : seule la formulation change. Réglage possible en un clic après génération : **plus court / plus détaillé**.

### 2. Mode « Narration automatique » (préremplissage)

- Un interrupteur **Narration automatique** en tête du bloc. Activé (par défaut si la conclusion est vide et que les données suffisent), il déclenche la génération dès que le diagnostic est exploitable — plus besoin de cliquer.
- Garde-fous : jamais d'écrasement d'un texte déjà saisi ; une génération unique par session tant que les données ne changent pas ; si l'utilisateur modifie le texte à la main, le mode automatique passe en veille et l'indique (« Texte repris à la main »).
- État vide explicite si le cortège est vide ou l'Étape 2 non renseignée : le mode reste proposé mais grisé, avec le motif.

### 3. Interface de choix

- Deux cartes côte à côte (empilées sur mobile), chacune avec son étiquette de registre, son texte, un compteur de mots, et les actions **Adopter** / **Ajouter à la suite**.
- La variante adoptée est marquée d'un liseré et d'une pastille « Adoptée » ; le texte atterrit dans le champ « Conclusion floristique », qui reste pleinement éditable.
- **Régénérer les deux** et **Ne garder que celle-ci** pour trancher rapidement.
- Traçabilité discrète sous le champ : registre retenu + horodatage de génération.

### 4. Cohérence de rendu

Le mode automatique et les cartes de variantes sont masqués à l'impression et dans la synthèse scellée : seul le texte final adopté figure dans le rapport client.

## Détails techniques

- `supabase/functions/propriete-diagnostic-narration/index.ts` : passage à une sortie double. Un seul appel au gateway Lovable AI (`google/gemini-3.6-flash`), sortie JSON `{ variants: [{ key, label, text }] }`, schéma volontairement plat, avec repli sur un parsing tolérant si le modèle renvoie du texte libre. Paramètre optionnel `length: 'court' | 'standard' | 'detaille'`. Rétrocompat : le champ `narration` reste renvoyé (première variante) pour ne rien casser.
- `src/components/propriete/identify/blocks/NarrativeBlock.tsx` : ajout de l'interrupteur, de l'état `variants`, `adoptedKey`, `dirtyByUser`, et du rendu deux colonnes. Aucune logique de calcul déplacée ; le bloc reste présentationnel.
- `src/components/propriete/tabs/TabIdentify.tsx` : passage d'une clé de signature du contexte (`observed_plants` + ICG + sol) pour savoir quand une régénération est pertinente.
- Erreurs du gateway remontées telles quelles dans un toast (429 = trop de requêtes, 402 = crédits épuisés).
- Aucune migration de base : le texte adopté continue d'être stocké dans `flora_conclusion`.
