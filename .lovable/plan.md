# Jardin des déesses still shown as Gaspard's "Propriétaire" property

## Diagnosis (checked in the database)
- The filter is working. In the property's links, Gaspard is recorded as **proprietaire**, not as a walker. This link was recreated today at 02:47:10, at the same moment the property's record was saved.
- Cause: when a property is saved with a "Marcheur référent", an automatic rule in the database guarantees that person has access. If no link exists yet, the rule creates one with the **Propriétaire** role by default. So when Gaspard removed his link and the property's record was saved afterwards (Gaspard still being the référent), the rule put him back as Propriétaire.
- 12 other properties have a référent recorded as Propriétaire. Most come from self-signup flows ("Jardin nourricier · …"), where that person really is the owner. They will not be changed.

## Fix
1. **Automatic rule**: when it has to create the link for a new référent, it will now use the **Marcheur** role instead of Propriétaire. A role already recorded will never be overwritten (current behaviour, kept).
2. **Fix the data**: Gaspard's link on "Jardin des déesses" is switched to **Marcheur**. He stays the référent, keeps his access and keeps the property as his main property.
3. **Property page**: under "Marcheur référent", one line will show the role actually recorded (for example "Rôle : Marcheur"), so this kind of mismatch is visible.

## Check
- Filter Utilisateur = gaspard.boreal@gmail.com + Rôle = Propriétaire: "Jardin des déesses" no longer appears.
- With Rôle = Marcheur, it does appear.

## Technical details
- Migration: `sync_propriete_main_walker_access()` inserts `'marcheur_historique'` (the `ON CONFLICT` keeps the existing role).
- `UPDATE propriete_marcheurs SET role='marcheur_historique' WHERE id='99904ffa-3a02-4474-adc9-4d153a67ab98'`. The `trg_propriete_marcheurs_role` trigger will refresh the community role.
- `AdminProprieteFiche.tsx`: show the role from `linkedMarcheurs` for `form.main_walker_id`.
