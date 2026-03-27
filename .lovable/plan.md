

# Fix : URLs cassées dans les citations

## Problème

Les 4 URLs Gallica sont toutes des ARK malformés (erreur 400). Les identifiants ont été inventés par l'IA.

## Corrections

**Fichier** : `src/components/community/FrequenceWave.tsx`

| Citation | URL actuelle (cassée) | URL corrigée |
|----------|----------------------|-------------|
| Proust, *La Prisonnière* | `gallica.bnf.fr/ark:/12148/bpt6k6570926h` | `https://gallica.bnf.fr/ark:/12148/bpt6k1049554b` |
| Chateaubriand, *Mémoires d'outre-tombe* | `gallica.bnf.fr/ark:/12148/bpt6k2078627` | `https://gallica.bnf.fr/essentiels/chateaubriand/memoires-outre-tombe` |
| Rousseau, *Les Confessions* | `gallica.bnf.fr/ark:/12148/bpt6k5818556v` | `https://gallica.bnf.fr/essentiels/rousseau/confessions` |
| Saint-Exupéry, *Terre des hommes* | `gallica.bnf.fr/ark:/12148/bpt6k4802771w` | `https://www.worldcat.org/title/1738850` (pas trouvé sur Gallica, remplacement par WorldCat) |

4 lignes à modifier dans le tableau `CITATIONS`.

