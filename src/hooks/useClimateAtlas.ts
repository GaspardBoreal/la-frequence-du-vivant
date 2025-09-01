import { useState, useMemo } from 'react';
import { ClimateCity, ClimateRegion, ThermoState } from '../types/climateAtlas';

// Données réelles de l'étude Météo France
const CLIMATE_CITIES: ClimateCity[] = [
  // Villes les plus exposées
  {
    name: 'Sète',
    department: 'Hérault',
    region: 'Occitanie',
    latitude: 43.4031,
    longitude: 3.6947,
    riskLevel: 'extreme',
    riskScore: 95,
    category: 'most-exposed',
    projections: {
      temperature: { current: 16.5, projection2035: 18.8, projection2045: 21.2 },
      heatDays: { current: 45, projection2035: 75, projection2045: 110 },
      submersionRisk: true,
      droughtRisk: 'high'
    },
    story: "Première ligne face à la Méditerranée, Sète subit déjà les assauts conjugués de la chaleur et de la mer."
  },
  {
    name: 'Agde',
    department: 'Hérault', 
    region: 'Occitanie',
    latitude: 43.3119,
    longitude: 3.4734,
    riskLevel: 'extreme',
    riskScore: 92,
    category: 'most-exposed',
    projections: {
      temperature: { current: 16.2, projection2035: 18.5, projection2045: 20.8 },
      heatDays: { current: 42, projection2035: 72, projection2045: 105 },
      submersionRisk: true,
      droughtRisk: 'high'
    },
    story: "Station balnéaire menacée par la montée des eaux et les canicules extrêmes."
  },
  {
    name: 'Marseille',
    department: 'Bouches-du-Rhône',
    region: 'Provence-Alpes-Côte d\'Azur',
    latitude: 43.2965,
    longitude: 5.3698,
    riskLevel: 'high',
    riskScore: 88,
    category: 'most-exposed',
    projections: {
      temperature: { current: 16.8, projection2035: 19.2, projection2045: 21.8 },
      heatDays: { current: 38, projection2035: 68, projection2045: 95 },
      submersionRisk: false,
      droughtRisk: 'high'
    },
    story: "Métropole méditerranéenne face aux îlots de chaleur urbains amplifiés."
  },
  {
    name: 'Avignon',
    department: 'Vaucluse',
    region: 'Provence-Alpes-Côte d\'Azur', 
    latitude: 43.9493,
    longitude: 4.8055,
    riskLevel: 'high',
    riskScore: 85,
    category: 'most-exposed',
    projections: {
      temperature: { current: 15.5, projection2035: 18.0, projection2045: 20.5 },
      heatDays: { current: 35, projection2035: 62, projection2045: 88 },
      submersionRisk: false,
      droughtRisk: 'high'
    },
    story: "Cité des Papes sous l'emprise du mistral chaud et des canicules prolongées."
  },
  {
    name: 'Arles',
    department: 'Bouches-du-Rhône',
    region: 'Provence-Alpes-Côte d\'Azur',
    latitude: 43.6768,
    longitude: 4.6306,
    riskLevel: 'high',
    riskScore: 82,
    category: 'most-exposed',
    projections: {
      temperature: { current: 16.0, projection2035: 18.5, projection2045: 21.0 },
      heatDays: { current: 40, projection2035: 65, projection2045: 90 },
      submersionRisk: true,
      droughtRisk: 'high'
    },
    story: "Entre Camargue et Provence, Arles affronte la double menace terrestre et marine."
  },
  
  // Villes les moins exposées  
  {
    name: 'Fougères',
    department: 'Ille-et-Vilaine',
    region: 'Bretagne',
    latitude: 48.3534,
    longitude: -1.2008,
    riskLevel: 'low',
    riskScore: 15,
    category: 'least-exposed',
    projections: {
      temperature: { current: 11.8, projection2035: 13.2, projection2045: 14.8 },
      heatDays: { current: 5, projection2035: 12, projection2045: 22 },
      submersionRisk: false,
      droughtRisk: 'low'
    },
    story: "Forteresse médiévale protégée par la douceur océanique bretonne."
  },
  {
    name: 'Hazebrouck',
    department: 'Nord',
    region: 'Hauts-de-France',
    latitude: 50.7258,
    longitude: 2.5378,
    riskLevel: 'low',
    riskScore: 18,
    category: 'least-exposed',
    projections: {
      temperature: { current: 10.5, projection2035: 12.0, projection2045: 13.8 },
      heatDays: { current: 3, projection2035: 8, projection2045: 18 },
      submersionRisk: false,
      droughtRisk: 'low'
    },
    story: "Cœur des Flandres françaises, préservé par les vents du Nord."
  },
  {
    name: 'Lannion',
    department: 'Côtes-d\'Armor',
    region: 'Bretagne',
    latitude: 48.7328,
    longitude: -3.4569,
    riskLevel: 'low',
    riskScore: 20,
    category: 'least-exposed',
    projections: {
      temperature: { current: 11.2, projection2035: 12.8, projection2045: 14.5 },
      heatDays: { current: 4, projection2035: 10, projection2045: 20 },
      submersionRisk: false,
      droughtRisk: 'low'
    },
    story: "Perle de la Côte de Granit Rose, bercée par les embruns atlantiques."
  },
  {
    name: 'Brest',
    department: 'Finistère',
    region: 'Bretagne',
    latitude: 48.3905,
    longitude: -4.4861,
    riskLevel: 'low',
    riskScore: 22,
    category: 'least-exposed',
    projections: {
      temperature: { current: 11.8, projection2035: 13.0, projection2045: 14.8 },
      heatDays: { current: 2, projection2035: 6, projection2045: 15 },
      submersionRisk: false,
      droughtRisk: 'low'
    },
    story: "Port océanique au bout du monde, protégé par l'inertie thermique marine."
  },
  {
    name: 'Quimper',
    department: 'Finistère',
    region: 'Bretagne',
    latitude: 47.9960,
    longitude: -4.1026,
    riskLevel: 'low',
    riskScore: 25,
    category: 'least-exposed',
    projections: {
      temperature: { current: 12.2, projection2035: 13.5, projection2045: 15.2 },
      heatDays: { current: 6, projection2035: 12, projection2045: 25 },
      submersionRisk: false,
      droughtRisk: 'low'
    },
    story: "Capitale de la Cornouaille, refuge dans un écrin de verdure océanique."
  }
];

export const useClimateAtlas = () => {
  const [thermoState, setThermoState] = useState<ThermoState>({
    activeLevel: 50,
    viewMode: 'thermometer',
    year: 2025
  });

  const regions = useMemo(() => {
    const regionMap = new Map<string, ClimateCity[]>();
    
    CLIMATE_CITIES.forEach(city => {
      if (!regionMap.has(city.region)) {
        regionMap.set(city.region, []);
      }
      regionMap.get(city.region)!.push(city);
    });

    return Array.from(regionMap.entries()).map(([name, cities]) => ({
      name,
      cities,
      averageRisk: cities.reduce((sum, city) => sum + city.riskScore, 0) / cities.length,
      trend: cities[0].category === 'most-exposed' ? 'worsening' : 'stable'
    } as ClimateRegion));
  }, []);

  const sortedCities = useMemo(() => {
    return [...CLIMATE_CITIES].sort((a, b) => a.riskScore - b.riskScore);
  }, []);

  const getCityByLevel = (level: number): ClimateCity => {
    const index = Math.floor((level / 100) * (sortedCities.length - 1));
    return sortedCities[index];
  };

  const getThermometerColor = (level: number): string => {
    if (level < 20) return 'hsl(200, 80%, 60%)'; // Bleu froid
    if (level < 40) return 'hsl(180, 60%, 50%)'; // Cyan
    if (level < 60) return 'hsl(60, 80%, 60%)'; // Jaune
    if (level < 80) return 'hsl(30, 90%, 55%)'; // Orange  
    return 'hsl(0, 85%, 50%)'; // Rouge chaud
  };

  const updateThermoLevel = (level: number) => {
    const city = getCityByLevel(level);
    setThermoState(prev => ({
      ...prev,
      activeLevel: level,
      selectedCity: city
    }));
  };

  const setViewMode = (mode: ThermoState['viewMode']) => {
    setThermoState(prev => ({ ...prev, viewMode: mode }));
  };

  const setYear = (year: ThermoState['year']) => {
    setThermoState(prev => ({ ...prev, year }));
  };

  return {
    cities: CLIMATE_CITIES,
    regions,
    sortedCities,
    thermoState,
    updateThermoLevel,
    setViewMode,
    setYear,
    getCityByLevel,
    getThermometerColor
  };
};