# Bandeau « observations du jour » : où est la Buse variable ?

## Ce qui se passe (vérifié en base et sur iNaturalist)
- La Buse variable (iNaturalist n° 407258720) a été **observée le samedi 10 octobre à 16h16**. Le bandeau ouvert est celui du **dimanche 11 octobre**.
- Ce bandeau range chaque observation au **jour où elle a été faite sur le terrain**, pas au jour où elle arrive dans l'app. La Buse se trouve donc dans la barre du 10 octobre, l'avant-dernière, avec le Leucocoprinus barssii du même jour. Comme une Buse avait déjà été vue sur l'événement, elle y figure sous « Re-observées ».
- Le bandeau du 11 octobre est exact : 4 observations de l'association ce matin, à savoir Diplocardia, Grillon champêtre et 2 Potirons.
- Rien ne manque. En revanche, l'écran ne permet pas de le comprendre : on ne voit pas qu'une observation de la veille vient d'arriver aujourd'hui, et on ne passe pas facilement d'un jour à l'autre.

## Ce qui change
1. **Nouvelle rubrique « Arrivées ce jour, observées plus tôt »** dans le bandeau. Pour le 11 octobre, elle affiche la Buse variable avec « observée le 10 oct. ». Un clic ouvre le jour en question.
2. **Flèches ◀ ▶ dans l'en-tête du bandeau** pour passer au jour précédent ou suivant sans refermer le bandeau.
3. **Rappel sous le titre** : « Classées par date d'observation sur le terrain ».
4. **Jours calculés à l'heure de Paris.** Aujourd'hui, une observation faite entre minuit et 2 h du matin peut tomber sur la veille. Elle sera désormais rangée au bon jour.

## Vérifications
- 10 octobre : la Buse variable apparaît, comme le Leucocoprinus.
- 11 octobre : 4 observations, et la Buse dans « Arrivées ce jour, observées plus tôt ».
- Les flèches font défiler les jours. Les totaux du graphique ne changent pas.

## Détails techniques
- `useBiodiversityEvolution` : calcul de `firstSyncedDay` par `originalUrl`, à partir du plus ancien `created_at` des snapshots qui la contiennent. Pour chaque `DayBucket`, ajout d'une liste `lateArrivals` : observations dont `firstSyncedDay === day` et dont la date terrain est antérieure. Cette liste est exclue des compteurs, pour ne pas compter deux fois.
- `toDayISO` : formatage `Europe/Paris` via `Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' })` au lieu de `toISOString()` ; les dates sans heure (`YYYY-MM-DD`) restent inchangées.
- `DayDetailDrawer` : nouvelle section, flèches de navigation (props `onPrevDay` / `onNextDay` calculées sur les jours triés), mention de la source de date. Le parent passe la liste des jours disponibles.
