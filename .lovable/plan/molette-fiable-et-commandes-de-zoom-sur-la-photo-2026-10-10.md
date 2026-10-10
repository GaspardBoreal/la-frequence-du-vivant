# Molette fiable et commandes de zoom sur la photo

## Diagnostic confirmé

- La visionneuse utilise bien un moteur de zoom et lui transmet une option de molette, mais elle ne possède pas de branchement natif de secours au niveau de la surface photo.
- Aucun plantage n’apparaît dans les journaux ; le défaut concerne donc l’interaction de la molette dans le navigateur, pas le chargement de l’image.
- Les commandes actuelles forment une barre centrée au bas de toute la zone. Elles ne sont pas suffisamment rattachées visuellement à la photo et peuvent être peu évidentes sur un très grand écran.

## Correctif proposé

### 1. Garantir la molette au niveau de la surface photo

- Installer sur la zone de la photo un écouteur natif non passif, plutôt que dépendre uniquement du branchement interne du moteur.
- Normaliser les différences entre molette de souris et pavé tactile afin d’obtenir une progression régulière, sans bond au zoom maximum.
- Zoomer autour du point exact visé par le pointeur : le détail placé sous la souris reste immobile pendant l’agrandissement.
- Bloquer le défilement de la page uniquement lorsque le pointeur se trouve sur la photo.
- Conserver les limites de sécurité liées à la définition réelle de l’image.

### 2. Placer un contrôle discret directement sur la photo

Ajouter dans l’angle inférieur droit de la surface photo une petite commande flottante :

- bouton **−** ;
- niveau courant en pourcentage ;
- bouton **+** ;
- icône **Ajuster** pour revenir à la photo entière.

La commande aura un fond sombre translucide, un contraste net et des boutons tactiles, sans masquer le centre de la photo. Sur mobile, elle restera dans la zone sûre et sera utilisable au pouce. Les libellés complets resteront disponibles en infobulle et pour les lecteurs d’écran.

### 3. Harmoniser toutes les interactions

- Molette, pavé tactile, pincement, double-clic/double-tap et boutons piloteront le même état de zoom.
- Le déplacement restera actif dès que la photo est agrandie.
- **Ajuster** remettra simultanément l’échelle et la position à leur état initial.
- Le passage à une autre photo repartira à 100 %.
- La navigation latérale entre photos restera active seulement lorsque la photo est à 100 %, pour éviter les changements accidentels pendant un déplacement.

## Validation

- Tester une molette physique et un pavé tactile, vers l’avant et vers l’arrière, avec ancrage sous le pointeur.
- Vérifier visuellement la commande flottante sur la photo aux dimensions actuelles de l’écran, puis sur mobile.
- Tester successivement **+**, **−**, **Ajuster**, double-clic, pincement et déplacement.
- Vérifier qu’aucun geste ne fait défiler la page derrière la visionneuse et qu’aucune erreur n’est introduite.

## Périmètre technique

Correction ciblée de la visionneuse photo existante. Aucun média, contenu, URL publique ou comportement des vidéos ne sera modifié.
