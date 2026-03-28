

# Restructuration de l'onglet Marches en 3 sections distinctes

## Constat

Actuellement, tous les evenements sont dans une liste plate triee (inscrits d'abord, puis par date). Un marcheur inscrit a 2 marches et voyant 1 marche disponible voit 3 cartes identiques sous le meme titre "Votre prochaine aventure". Aucune hierarchie visuelle ne distingue ce qui le concerne directement de ce qu'il peut encore decouvrir.

## Structure proposee : 3 sections narratives

### Section 1 — "Mes aventures" (evenements inscrits)
- Cartes avec bordure doree/ambre lumineuse, fond plus chaud
- Countdown prominent, badge "Inscrit" deja present
- Titre de section : "Mes aventures a venir" avec icone Sparkles
- Si aucune inscription : message incitatif "Aucune marche au programme — explorez les sentiers ci-dessous"

### Section 2 — "Sentiers a explorer" (evenements a venir, non inscrits)
- Cartes neutres (style actuel bg-white/5)
- Bouton CTA "S'inscrire" bien visible
- Titre de section : "Sentiers a explorer" avec icone Compass
- Message contextuel si tout est deja inscrit : "Vous etes inscrit a toutes les marches — bravo !"

### Section 3 — "Mon carnet de route" (historique des participations)
- Reste tel quel, compact
- Titre renomme "Mon carnet de route" au lieu de "Historique"

### QR Code
- Reste en bas, entre sections 2 et 3

## Fichier modifie

| Fichier | Changement |
|---------|-----------|
| `src/components/community/tabs/MarchesTab.tsx` | Separer `sortedEvents` en deux listes (`myEvents` / `discoverEvents`), creer 3 blocs visuels distincts avec titres et messages adaptatifs |

