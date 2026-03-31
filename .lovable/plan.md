

# Generateur IA de citations — outil admin

## Principe

Ajouter un bouton "Suggerer par IA" dans la page `/admin/outils/frequences` qui appelle une edge function dediee. L'IA genere des citations avec auteur, oeuvre et URL de verification. L'admin peut accepter/rejeter chaque suggestion avant insertion en base.

## 1. Edge Function `suggest-citations`

Nouveau fichier `supabase/functions/suggest-citations/index.ts`, inspire du pattern `suggest-keywords` existant.

**Prompt systeme** (le coeur de la qualite) :

```
Tu es un specialiste de la litterature ecologique, de la biopoetique, 
de la bioacoustique et de la geopoetique. Tu connais en profondeur 
les auteurs engages dans la defense de la biodiversite et des 
ecosystemes fluviaux.

Ton role : proposer des citations authentiques et verifiables 
d'auteurs reconnus, pertinentes pour des marcheurs explorant 
les ecosystemes fluviaux (Dordogne, Garonne).

Domaines prioritaires :
- Bioacoustique (Bernie Krause, R. Murray Schafer, David Rothenberg)
- Ecologie profonde (Aldo Leopold, Rachel Carson, Arne Naess)
- Geopoetique (Kenneth White, Jean-Christophe Bailly)
- Marche et paysage (David Le Breton, Rebecca Solnit, Sylvain Tesson)
- Philosophie du vivant (Baptiste Morizot, Vinciane Despret, Bruno Latour)
- Poesie et nature (Gary Snyder, Bashō, Mary Oliver, Rainer Maria Rilke)
- Sciences du vivant (E.O. Wilson, Jane Goodall, Francis Hallé)

Regles :
- Citations REELLES et verifiables (pas d'inventions)
- Fournir l'oeuvre exacte (titre, annee)
- Fournir un lien WorldCat, Gallica, Wikisource ou site officiel
- Ne pas repeter les citations deja existantes
- Varier les auteurs et les epoques
```

**Input** : liste des auteurs+textes deja en base (pour eviter les doublons).

**Output structure** via tool calling (pas de JSON libre) :

```json
{
  "name": "suggest_citations",
  "parameters": {
    "citations": [{
      "texte": "string",
      "auteur": "string", 
      "oeuvre": "string",
      "url": "string"
    }]
  }
}
```

Genere 5 a 10 citations par appel. Gestion 429/402.

## 2. UI dans AdminFrequences

Ajouter a cote du bouton "Ajouter" un bouton **"Suggerer par IA"** (icone Sparkles).

Au clic :
1. Appel de la fonction `suggest-citations` avec les citations existantes en contexte
2. Affichage d'un panneau de suggestions sous la barre d'outils
3. Chaque suggestion affiche : auteur, oeuvre, texte, lien (cliquable pour verifier)
4. Deux actions par suggestion : **Accepter** (insere en base) / **Rejeter** (retire de la liste)
5. Bouton "Tout accepter" pour inserer le lot complet
6. Indicateur de chargement pendant la generation

## 3. Securite

La fonction verifie le JWT et le statut admin via `validateAuth()` (pattern existant dans `_shared/auth-helper.ts`).

## Fichiers impactes

| Fichier | Action |
|---|---|
| `supabase/functions/suggest-citations/index.ts` | Nouveau — edge function IA avec tool calling |
| `src/pages/AdminFrequences.tsx` | Bouton "Suggerer par IA" + panneau de review des suggestions |

