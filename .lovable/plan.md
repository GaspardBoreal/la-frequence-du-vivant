## Objectif

Capturer les deux orthographes « **Deviat** » (officielle INSEE) et « **Déviat** » (usage courant avec accent) sans dupliquer de page ni diluer le signal SEO.

## Stratégie recommandée : orthographe officielle en canonique + variante en signaux secondaires

Google et les IA génératives gèrent très bien les variantes accentuées **à condition** que les deux formes apparaissent dans le contenu indexable. La meilleure pratique est :

- **Une seule URL, un seul `<title>`, un seul H1 canonique** → évite la cannibalisation.
- **Les deux orthographes présentes dans le corps sémantique** (description, keywords, JSON-LD `alternateName`, `llms.txt`) → capture les deux requêtes.

### Choix de la forme canonique : **Deviat** (sans accent)

Raisons :
1. C'est l'orthographe **officielle INSEE / La Poste / cadastre** (commune de Deviat, 16250, Charente).
2. Google Maps, Wikipédia FR et OpenStreetMap utilisent « Deviat ».
3. Les moteurs matchent automatiquement les variantes diacritiques (« Déviat » → « Deviat » et inverse), donc mettre la forme officielle en canonique ne perd **aucun trafic** sur la variante accentuée.
4. Cela évite qu'un journaliste ou une IA relaie une forme fautive comme référence.

## Correctifs ciblés

### 1. `public/llms.txt`

Remplacer « Jardin de Déviat » par « **Jardin de Deviat** » et **ajouter la variante** dans la description :

```
- [Jardin de Deviat (Charente)](/jardin/deviat-…): jardin-monde à Deviat (aussi orthographié Déviat) en Charente (16250)…
```

Bénéfice : ChatGPT/Claude/Perplexity voient les deux formes dans le même bloc et associent l'URL aux deux requêtes.

### 2. `src/pages/ImmersiveGardenFiche.tsx`

- **`<title>`** et **H1 sr-only** : garder « Deviat » (forme officielle).
- **`<meta name="description">`** : inclure la formule *« Jardin de Deviat (aussi écrit Déviat), Charente »* → capture les deux dans les SERP.
- **`<meta name="keywords">`** : `Deviat, Déviat, jardin, biodiversité, Charente, 16250, Marches du Vivant`.
- **JSON-LD `Place`** : ajouter `"alternateName": ["Jardin de Déviat", "Jardin-monde de Deviat"]` → Google Knowledge Graph enregistre officiellement les deux variantes comme désignations valides de la même entité.

### 3. `public/sitemap.xml`

Aucun changement — une seule URL canonique reste la bonne pratique.

## Ce qu'il ne faut PAS faire

- ❌ Créer une seconde URL `/jardin/deviat-accent` ou une redirection dédiée → duplication de contenu.
- ❌ Répéter « Deviat/Déviat » de manière artificielle dans les titres → keyword stuffing pénalisé.
- ❌ Mettre « Déviat » en canonique → contredit les sources officielles et affaiblit la crédibilité pour les IA qui vérifient contre Wikidata/INSEE.

## Résultat attendu

- Requête Google « Deviat » **et** « Déviat » → même page remonte.
- ChatGPT/Perplexity citent la page quelle que soit l'orthographe employée par l'utilisateur.
- L'entité Knowledge Graph enregistre « Deviat » comme nom principal et « Déviat » comme `alternateName`, ce qui renforce la fiche à long terme.

## Périmètre

3 fichiers touchés, ~10 lignes modifiées. Aucun changement structurel ni backend.
