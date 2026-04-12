

## Associer la photo de Victor Boixeda a la marche DEVIAT Point 06

### Donnees identifiees

| Element | Valeur |
|---------|--------|
| Victor Boixeda (user_id) | `7a5cc1a2-301c-4070-ae62-248558ce0eec` |
| Marche "DEVIAT Point 06 Feverolles" | `546d2fc5-56a5-407b-a672-20717dac06f2` |
| Marche event (exploration) | `df85910e-82da-4ef7-98d2-d4c827d1d0ec` |

### Actions

1. **Copier la photo** `Coccinelle_Moulin_de_Texier.JPG` dans le projet puis l'uploader vers le bucket `marcheur-uploads` via un script (path : `{user_id}/{timestamp}_Coccinelle_Moulin_de_Texier.JPG`)

2. **Inserer dans `marcheur_medias`** avec :
   - `user_id` = Victor
   - `marche_event_id` = event de l'exploration
   - `marche_id` = Point 06 Feverolles
   - `type_media` = `'photo'`
   - `url_fichier` = URL publique du fichier uploade
   - `is_public` = `true`
   - `shared_to_web` = `true`
   - `titre` = `'Coccinelle au Moulin de Texier'`

### Fichiers impactes

Aucun fichier du projet n'est modifie. Operations uniquement en base de donnees et stockage Supabase.

