

## Intégrer la vue "Inscriptions par marcheur" dans l'onglet Marcheurs de /admin/community

### Emplacement recommandé

L'onglet **"Marcheurs"** de `/admin/community` (CommunityProfilesAdmin.tsx) est actuellement un placeholder vide avec le texte "Fonctionnalités à venir". C'est le lieu naturel pour cette fonctionnalité car :

- Il est déjà dans le contexte "Communauté des Marcheurs"
- L'onglet "Communauté" liste déjà les profils (nom, rôle, ville)
- L'onglet "Marcheurs" est prévu pour les "parcours individuels, historique détaillé" — exactement ce besoin
- Les données `marche_participations` + `marche_events` sont facilement joinables

### Design proposé

Remplacer le placeholder par un tableau interactif :

```text
┌─────────────────────────────────────────────────────────────┐
│ 🔍 [Recherche marcheur...]     [Filtre événement ▼]        │
├──────────┬──────────────┬─────────────┬────────┬───────────┤
│ Marcheur │ Événement    │ Type        │ Date   │ Statut    │
├──────────┼──────────────┼─────────────┼────────┼───────────┤
│ Alice D. │ Transhumance │ 🌱 Agro     │ 29 mar │ ✅ Présent│
│ Alice D. │ DEVIAT 1     │ 🌱 Agro     │ 05 jan │ ✅ Présent│
│ Bob M.   │ Transhumance │ 🌱 Agro     │ 29 mar │ ✅ Présent│
│ Claire P.│ Réveil Terre │ 🌿 Éco poé  │ 11 avr │ 📋 Inscrit│
└──────────┴──────────────┴─────────────┴────────┴───────────┘
```

**Fonctionnalités** :
- Requête jointe `marche_participations` → `marche_events` (titre, date, event_type, lieu) → `community_profiles` (prénom, nom)
- Badges colorés par type (emerald/violet/amber) via `getMarcheEventTypeMeta`
- Recherche par nom de marcheur
- Filtre par événement (dropdown)
- Compteurs en haut : total inscriptions, marcheurs uniques, événements couverts
- Statut de participation (`registered` / `present`)

### Fichier impacté

| Action | Fichier |
|--------|---------|
| Modifier | `src/pages/CommunityProfilesAdmin.tsx` — remplacer le placeholder de l'onglet "Marcheurs" |

