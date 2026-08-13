# Ajout date et pied de fiche — Fréquence Jardin

Ajouter, dans la fiche application « Fréquence Jardin » (web, Markdown, PDF) :

- **En en-tête** : la date de publication `15.08.2026`.
- **En pied de fiche** : les coordonnées de l'association
  - Association LA FREQUENCE DU VIVANT
  - 6 rue du Champ de Foire
  - 16 190 DEVIAT
  - Contact :
  - Laurent TRIPIED : lt@bziiit.com / 06 70 76 14 99

## Fichiers concernés

1. `src/content/frequenceJardinFiche.ts`
   - Ajouter `publishedAt: '15.08.2026'`.
   - Ajouter `imprint` (objet association + contact).
   - Intégrer ces données dans `ficheToMarkdown()` (date sous le titre, bloc coordonnées avant le séparateur final).

2. `src/pages/FrequenceJardinFiche.tsx`
   - Afficher la date sous le badge « Fiche application » et au-dessus du titre.
   - Ajouter un bloc coordonnées de l'association en bas de page, avant la section « Reprendre cette fiche ».

3. `src/components/roadmap/FrequenceJardinPdf.tsx`
   - Afficher la date sur la page de garde, sous le titre ou à côté du badge.
   - Ajouter un pied de document fixe sur la dernière page (ou en bas de chaque page) avec les coordonnées de l'association ; conserver la pagination existante.

## Vérification

- Page web : date et coordonnées visibles en 375 px et 1280 px.
- Markdown téléchargé : date et bloc coordonnées présents, titres corrects.
- PDF : converti en images, vérification visuelle de la date sur la page de garde et du bloc coordonnées en bas de la dernière page, sans débordement.
