import ReactPDF from '@react-pdf/renderer';
import CarnetTerrainDocument from './src/components/propriete/tour/carnet/CarnetTerrainPdf';

const tour: any = {
  id: 't1', propriete_id: 'p', created_by: null,
  titre: 'Tour de septembre — actualiser et ouvrir',
  intention: null, date_tour: '2026-09-20', statut: 'recommande', duree_min: 150,
  saison: "Fin d'été / début d'automne",
  points_forts: ['La haie champêtre du nord est déjà continue et fournit couvert et nourriture', 'Le sol reste couvert sous les fruitiers', 'Présence de Sylvia atricapilla', 'Point d’eau permanent', 'Ourlet non fauché le long du chemin'],
  potentiels: ['Ouvrir une clairière en lisière est', 'Créer un tas de bois mort à l’ombre', 'Étager la lisière sud', 'Laisser un refuge non tondu de 60 m²', 'Compléter la palette mellifère'],
  notes: null, source: 'ia', carnet_edite_at: null, created_at: '', updated_at: '',
};
const mk = (i: number, volet: string, titre: string, detail: string, schema: string | null, refs: any[]) => ({
  id: 'a' + i, tour_id: 't1', titre, volet, detail, schema_key: schema, moment: i % 2 ? 'matin frais' : null,
  difficulte: (i % 3) + 1, done: false, done_at: null, retenue: true, order_index: i, refs, source: 'ia', created_at: '',
});
const actions: any[] = [
  mk(0, 'observer', 'Repérer les insaisissables du secteur « Verger haut »', "Passez lentement, l’œil bas : notez ce qui bouge dans l’ourlet non fauché, entre 9h et 11h, quand la rosée s’évapore et que les pollinisateurs sortent.", 'ourlet', [{kind:'zone', label:'Verger haut'}, {kind:'species', label:'Sylvia atricapilla'}]),
  mk(1, 'observer', 'Relire la carotte de sol C3', "Comparer la couleur et l’odeur de l’horizon de surface avec le prélèvement d’avril.", null, [{kind:'sample', label:'Carotte C3'}]),
  mk(2, 'biodiversite', 'Monter un tas de bois mort à l’ombre de la haie', "Empiler branches et rondins de 5 à 20 cm, sur 1 m², au contact du sol, à l’abri du vent dominant. C’est l’un des gestes les plus rentables pour la petite faune saproxylique.", 'bois-mort', [{kind:'zone', label:'Haie nord'}]),
  mk(3, 'biodiversite', 'Laisser un refuge non tondu de 60 m²', "Délimitez au sécateur, piquetez les coins, et n’y repassez pas avant mars.", 'refuge-non-tondu', []),
  mk(4, 'biodiversite', 'Constituer un tas de feuilles', "Ratisser les feuilles du chemin vers le pied de la haie.", 'tas-feuilles', []),
  mk(5, 'resilience', 'Vérifier le point d’eau avant les gelées', "Contrôler l’étanchéité, dégager la pente douce de sortie pour les amphibiens.", 'point-eau', [{kind:'objet', label:'Mare basse'}]),
  mk(6, 'resilience', 'Pailler les jeunes plantations', "8 à 10 cm de broyat, en couronne, sans toucher le collet.", 'sol-couvert', []),
  mk(7, 'resilience', 'Relever la sonde d’humidité', "Noter la valeur et l’heure ; comparer à la semaine précédente.", null, [{kind:'capteur', label:'Sonde Verger'}]),
];
await ReactPDF.renderToFile(
  <CarnetTerrainDocument tour={tour} actions={actions} proprieteNom="Maison sous Blossac" options={{format:'A5', includeContexte:true, includeNotes:true}} pageUrl="la-frequence-du-vivant.com/propriete/maison-sous-blossac" />,
  '/tmp/carnetqa/a5.pdf');
await ReactPDF.renderToFile(
  <CarnetTerrainDocument tour={tour} actions={actions.slice(0,4)} proprieteNom="Maison sous Blossac" options={{format:'A4', includeContexte:false, includeNotes:false}} pageUrl="" />,
  '/tmp/carnetqa/a4.pdf');
console.log('ok');
