## Objectif
Centrer correctement "Nos équipes…" et "IA responsable · Open Source · Ancrage terrain" dans le bloc CTA final, en supprimant les `&nbsp;` de décalage qui cassent le centrage.

## Modifications

### `src/pages/AgentIA.tsx` (section CTA, l.224-225)
Remplacer :
```tsx
<p className="text-lg text-muted-foreground mb-2">&nbsp; &nbsp; ... Nos équipes ...</p>
<p className="text-sm italic text-primary mb-8">&nbsp; &nbsp; ... IA responsable · Open Source · Ancrage terrain</p>
```
Par :
```tsx
<p className="text-lg text-muted-foreground mb-2">Nos équipes vous accompagnent de la première marche au premier rapport public.</p>
<p className="text-sm italic text-primary mb-8">IA responsable · Open Source · Ancrage terrain</p>
```
Le parent `<section>` possède déjà `text-center` → centrage automatique et responsive.

### PDF `public/fiche-agent-marches-du-vivant.pdf`
Si un script de génération existe avec ces lignes, s'assurer que les paragraphes utilisent `alignment=TA_CENTER` sans espaces manuels, puis régénérer. Sinon, ignorer (le PDF est statique).

## Résultat attendu
Les deux lignes apparaissent parfaitement centrées sous le titre "Prêt à mesurer le vivant de votre domaine ?", sur tous écrans.
