---
name: Journal des briques VDTP
description: /partenaires/vdtp/journal — frise chronologique des briques livrées depuis la proposition /offre-VDT-MDV du 9 juillet 2026, contenu dans src/content/vdtp/journal.ts, même mot de passe que le configurateur
type: feature
---

- Page de négociation Ver de Terre Production : `/offre-VDT-MDV` (`src/pages/OffreVdtMdv.tsx`), créée le 9 juillet 2026. Configurateur `/partenaires/vdtp/configurateur` créé le 18 septembre 2026.
- `/partenaires/vdtp/journal` (`src/pages/VdtpJournal.tsx`) : frise datée des briques livrées, 4 thèmes (Observer/Mesurer/Raconter/Piloter), mobile first.
- Contenu unique dans `src/content/vdtp/journal.ts` : ajouter une brique = une entrée `JournalEntry` (date ISO, titre, description, theme, lien facultatif, statut). Ne jamais toucher la page pour ajouter une brique.
- Protection : même mot de passe que le configurateur (`PARTNER_AUDIT_PASSWORD`, sessionStorage `vdtp-configurateur-unlocked` partagé) → page noindex, volontairement absente du sitemap et de llms.txt.
- Liens croisés : bouton « Voir les briques livrées » sur `/offre-VDT-MDV` (ClosingSection) et dans le configurateur.
