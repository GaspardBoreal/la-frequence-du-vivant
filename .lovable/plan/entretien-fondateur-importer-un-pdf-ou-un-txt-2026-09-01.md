# Entretien fondateur : importer un PDF ou un TXT

Aujourd'hui, le dépôt d'un entretien impose un copier-coller manuel dans le champ « Transcription ». On ajoute l'import de fichier.

## Ce que voit l'utilisateur

- Dans le formulaire de dépôt (Portrait › Entretiens › Déposer un entretien), une zone d'import au-dessus du champ Transcription : « Importer un fichier (PDF, TXT, MD, CSV) » — bouton + glisser-déposer.
- Le texte du fichier est extrait dans le navigateur et remplit automatiquement le champ Transcription, qui reste modifiable avant validation.
- Pendant l'extraction : indicateur « Lecture du document… ». À la fin : nom du fichier, nombre de signes extraits, et bouton pour retirer le fichier.
- Le titre de l'entretien se pré-remplit avec le nom du fichier s'il est encore à sa valeur par défaut, et la source bascule sur « fichier ».
- Messages d'erreur clairs : fichier > 10 Mo, format non supporté, PDF scanné sans texte extractible (« Aucun texte n'a pu être extrait — collez la transcription manuellement »).
- Les règles existantes ne changent pas : minimum 200 signes, case de consentement, récolte IA inchangée.

## Détails techniques

- Réutiliser `src/hooks/useDocumentExtractor.ts` (déjà en place : PDF via pdf.js CDN, lecture texte pour txt/csv/md, garde-fous taille et format).
- Point d'attention : ce hook tronque à 12 000 caractères, ce qui est trop court pour une transcription d'entretien (Ormetteaux ≈ 37 pages). On rend la limite paramétrable (`useDocumentExtractor({ maxLength })`) en gardant 12 000 par défaut, et l'onglet Entretiens passe une limite haute (≈ 400 000 signes) pour ne rien perdre.
- `src/components/propriete/portrait/PortraitEntretiens.tsx` (`EntretienForm`) : ajouter l'input fichier caché + zone de dépôt, brancher `processFile`, écrire le texte extrait dans l'état `transcript`, afficher état/erreur.
- Aucun changement de base de données, de RLS ni d'Edge Function : le PDF n'est pas stocké, seul le texte extrait est enregistré dans `propriete_entretiens.transcript` comme aujourd'hui.
