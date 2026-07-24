import contextImg from '@/assets/observe/context.jpg';
import reliefImg from '@/assets/observe/relief.jpg';
import sunImg from '@/assets/observe/sun.jpg';
import windImg from '@/assets/observe/wind.jpg';
import waterImg from '@/assets/observe/water.jpg';
import vegetationImg from '@/assets/observe/vegetation.jpg';
import terrainImg from '@/assets/observe/terrain.jpg';
import sensorialImg from '@/assets/observe/sensorial.jpg';

export type ObserveBlockId =
  | 'context'
  | 'relief'
  | 'sun'
  | 'wind'
  | 'water'
  | 'vegetation'
  | 'terrain'
  | 'sensorial';

export interface ObserveChoice {
  value: string;
  label: string;
  icon?: string; // emoji picto
}

export interface ObserveBlock {
  id: ObserveBlockId;
  number: number;
  category: string;
  title: string;
  hero: string;
  choices: ObserveChoice[];
}

export const OBSERVE_BLOCKS: ObserveBlock[] = [
  {
    id: 'context',
    number: 1,
    category: 'Le contexte général',
    title: 'Où se situe le jardin ?',
    hero: contextImg,
    choices: [
      { value: 'ville', label: 'Ville', icon: '🏙️' },
      { value: 'campagne', label: 'Campagne', icon: '🌾' },
      { value: 'littoral', label: 'Littoral', icon: '🌊' },
      { value: 'montagne', label: 'Montagne', icon: '⛰️' },
      { value: 'boisee', label: 'Zone boisée', icon: '🌳' },
      { value: 'autre', label: 'Autre', icon: '✧' },
    ],
  },
  {
    id: 'relief',
    number: 2,
    category: 'Le relief',
    title: 'Le terrain est-il…',
    hero: reliefImg,
    choices: [
      { value: 'plat', label: 'Plat', icon: '━' },
      { value: 'pente_legere', label: 'Légère pente', icon: '╱' },
      { value: 'pentu', label: 'Pentu', icon: '⟋' },
      { value: 'terrasse', label: 'En terrasse', icon: '⌐' },
    ],
  },
  {
    id: 'sun',
    number: 3,
    category: "L'ensoleillement",
    title: 'Exposition & ombres portées',
    hero: sunImg,
    choices: [
      { value: 'mur', label: 'Mur', icon: '🧱' },
      { value: 'arbre', label: 'Arbre', icon: '🌳' },
      { value: 'haie', label: 'Haie', icon: '🌿' },
      { value: 'talus', label: 'Talus', icon: '⛰️' },
    ],
  },
  {
    id: 'wind',
    number: 4,
    category: 'Le vent',
    title: 'Exposition au vent',
    hero: windImg,
    choices: [
      { value: 'haie', label: 'Haie', icon: '🌿' },
      { value: 'mur', label: 'Mur', icon: '🧱' },
      { value: 'batiment', label: 'Bâtiment', icon: '🏠' },
      { value: 'talus', label: 'Talus', icon: '⛰️' },
    ],
  },
  {
    id: 'water',
    number: 5,
    category: "L'eau",
    title: 'Sous quelle forme ?',
    hero: waterImg,
    choices: [
      { value: 'stagnation', label: 'Stagnation', icon: '💧' },
      { value: 'humide', label: 'Humide', icon: '☔' },
      { value: 'sec', label: 'Sec', icon: '☀️' },
      { value: 'ruissellement', label: 'Ruissellement', icon: '〰️' },
      { value: 'gouttiere', label: 'Sortie gouttière', icon: '⇣' },
    ],
  },
  {
    id: 'vegetation',
    number: 6,
    category: 'Végétation présente',
    title: 'Que raconte-t-elle ?',
    hero: vegetationImg,
    choices: [
      { value: 'dense', label: 'Dense', icon: '🌳' },
      { value: 'clairsemee', label: 'Clairsemée', icon: '🌱' },
      { value: 'mousse', label: 'Mousse', icon: '🍃' },
      { value: 'adventice', label: 'Adventices', icon: '🌾' },
      { value: 'saine', label: 'Saine', icon: '✿' },
      { value: 'malade', label: 'Malade', icon: '⚠︎' },
    ],
  },
  {
    id: 'terrain',
    number: 7,
    category: 'Particularités du terrain',
    title: 'Le terrain subit…',
    hero: terrainImg,
    choices: [
      { value: 'pietinement', label: 'Piétinement', icon: '👣' },
      { value: 'tassement', label: 'Tassement', icon: '⬇︎' },
      { value: 'pollution', label: 'Pollution', icon: '☣︎' },
      { value: 'ombre_permanente', label: 'Ombre permanente', icon: '☁︎' },
      { value: 'secheresse', label: 'Sécheresse', icon: '🔆' },
      { value: 'inondation', label: 'Inondation', icon: '🌊' },
      { value: 'sel', label: 'Sel', icon: '⁘' },
      { value: 'vent_salin', label: 'Vent salin', icon: '🌬️' },
    ],
  },
];

export const SENSORIAL_FIELDS = [
  { key: 'sons', label: 'Sons', icon: '👂', placeholder: 'chant d\'oiseaux, vent dans les feuilles…' },
  { key: 'odeurs', label: 'Odeurs', icon: '👃', placeholder: 'humus, fleurs, résine…' },
  { key: 'textures', label: 'Textures', icon: '✋', placeholder: 'écorce rugueuse, mousse douce…' },
  { key: 'vues', label: 'Vues', icon: '👁️', placeholder: 'cadres remarquables, horizons…' },
  { key: 'ambiance', label: 'Ambiance ressentie', icon: '✧', placeholder: 'calme, joyeux, mystérieux…' },
] as const;

export const SENSORIAL_HERO = sensorialImg;
