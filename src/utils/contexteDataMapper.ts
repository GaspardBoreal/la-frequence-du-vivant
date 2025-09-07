import { MarcheContexteHybrid } from '@/types/opus';

export interface ContexteMetricData {
  title: string;
  data: any;
  unit?: string;
  metricType: 'description' | 'quality' | 'sources' | 'temperature' | 'depth' | 'phenomena' | 'ph' | 'source_ids' | 'flow';
}

export const mapContexteData = (contexteData: any): ContexteMetricData[] => {
  if (!contexteData) {
    console.warn('No contexte_data provided to mapContexteData');
    return [];
  }

  // Debug log pour voir la structure des données
  console.log('Contexte data structure:', {
    keys: Object.keys(contexteData),
    contexte_hydrologique: contexteData.contexte_hydrologique,
    especes_caracteristiques: contexteData.especes_caracteristiques
  });

  const hydrologique = contexteData.contexte_hydrologique || {};
  const especes = contexteData.especes_caracteristiques || {};
  
  return [
    {
      title: 'Description',
      data: hydrologique.description || contexteData.description || 'Aucune description disponible',
      metricType: 'description'
    },
    {
      title: 'Qualité eau',
      data: hydrologique.qualite_eau || hydrologique.qualite || 'Non renseigné',
      metricType: 'quality'
    },
    {
      title: 'Sources note',
      data: hydrologique.sources_note || hydrologique.note_sources || 'Non évalué',
      metricType: 'sources'
    },
    {
      title: 'Température eau',
      data: hydrologique.temperature_eau || hydrologique.temperature || 'Non mesurée',
      unit: '°C',
      metricType: 'temperature'
    },
    {
      title: 'Profondeur moyenne',
      data: hydrologique.profondeur_moyenne || hydrologique.profondeur || 'Non mesurée',
      unit: 'm',
      metricType: 'depth'
    },
    {
      title: 'Phénomènes particuliers',
      data: hydrologique.phenomenes_particuliers || hydrologique.phenomenes || 'Aucun signalé',
      metricType: 'phenomena'
    },
    {
      title: 'pH',
      data: hydrologique.ph || hydrologique.pH || 'Non mesuré',
      unit: 'pH',
      metricType: 'ph'
    },
    {
      title: 'Source IDs',
      data: hydrologique.source_ids || hydrologique.sources_ids || contexteData.sources || [],
      metricType: 'source_ids'
    },
    {
      title: 'Débit moyen',
      data: hydrologique.debit_moyen || hydrologique.debit || 'Non mesuré',
      unit: 'm³/s',
      metricType: 'flow'
    }
  ];
};

export const formatComplexData = (data: any): string => {
  if (data === null || data === undefined) return 'Non renseigné';
  
  if (Array.isArray(data)) {
    if (data.length === 0) return 'Aucune donnée';
    if (data.length <= 3) return data.join(', ');
    return `${data.slice(0, 2).join(', ')} + ${data.length - 2} autres`;
  }
  
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 0) return 'Objet vide';
    if (keys.length <= 2) return keys.join(', ');
    return `${keys.slice(0, 2).join(', ')} + ${keys.length - 2} propriétés`;
  }
  
  if (typeof data === 'string' && data.length > 100) {
    return data.substring(0, 97) + '...';
  }
  
  return String(data);
};

export const getDataAvailability = (data: any): 'available' | 'partial' | 'missing' => {
  if (!data || data === 'Non renseigné' || data === 'Non mesuré' || data === 'Non évalué') return 'missing';
  if (Array.isArray(data) && data.length === 0) return 'missing';
  if (typeof data === 'object' && Object.keys(data).length === 0) return 'missing';
  if (typeof data === 'string' && (data.includes('Non') || data.includes('Aucun'))) return 'partial';
  return 'available';
};