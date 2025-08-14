import { useQuery } from '@tanstack/react-query';
import { ClimateProjection, BiodiversityProjection, FutureSoundscape } from '../types/climate';

interface ClimateProjectionQuery {
  latitude: number;
  longitude: number;
  scenarios: Array<'present' | '2035' | '2045'>;
}

// Mock data generator for climate projections
const generateClimateProjections = (latitude: number, longitude: number): ClimateProjection[] => {
  const baseTemp = 12; // Average temp for France
  const basePrecip = 650; // Average precipitation for France
  
  return [
    {
      year: 2025,
      scenario: 'present',
      temperature: {
        avg: baseTemp,
        min: baseTemp - 8,
        max: baseTemp + 12,
        change: 0
      },
      precipitation: {
        total: basePrecip,
        change: 0
      },
      extremeEvents: {
        heatDays: 15,
        frostDays: 25,
        droughtRisk: 'low'
      }
    },
    {
      year: 2035,
      scenario: '2035',
      temperature: {
        avg: baseTemp + 1.8,
        min: baseTemp - 6,
        max: baseTemp + 15,
        change: 1.8
      },
      precipitation: {
        total: basePrecip * 0.92,
        change: -8
      },
      extremeEvents: {
        heatDays: 35,
        frostDays: 15,
        droughtRisk: 'medium'
      }
    },
    {
      year: 2045,
      scenario: '2045',
      temperature: {
        avg: baseTemp + 3.2,
        min: baseTemp - 4,
        max: baseTemp + 18,
        change: 3.2
      },
      precipitation: {
        total: basePrecip * 0.85,
        change: -15
      },
      extremeEvents: {
        heatDays: 55,
        frostDays: 8,
        droughtRisk: 'high'
      }
    }
  ];
};

// Mock biodiversity projections based on climate thresholds
const generateBiodiversityProjections = (climateData: ClimateProjection[]): BiodiversityProjection[] => {
  const species = [
    {
      species: 'Parus major',
      commonName: 'Mésange charbonnière',
      tempMin: -5,
      tempMax: 25,
      precipitationMin: 400,
      story: "Espèce adaptable, survivra aux changements mais modifiera ses périodes de reproduction."
    },
    {
      species: 'Hirundo rustica',
      commonName: 'Hirondelle rustique',
      tempMin: 5,
      tempMax: 30,
      precipitationMin: 300,
      story: "Migration précoce de 2 semaines en 2035, adaptation progressive aux nouveaux cycles."
    },
    {
      species: 'Upupa epops',
      commonName: 'Huppe fasciée',
      tempMin: 8,
      tempMax: 35,
      precipitationMin: 200,
      story: "Bénéficiaire du réchauffement, expansion vers le nord, nouvelles colonies en 2045."
    },
    {
      species: 'Emberiza citrinella',
      commonName: 'Bruant jaune',
      tempMin: -10,
      tempMax: 20,
      precipitationMin: 500,
      story: "Régression probable, migration vers des zones plus fraîches en altitude."
    }
  ];

  return species.map(sp => {
    const present = climateData[0];
    const future2035 = climateData[1];
    const future2045 = climateData[2];

    const canSurvive = (climate: ClimateProjection) => 
      climate.temperature.avg >= sp.tempMin && 
      climate.temperature.avg <= sp.tempMax && 
      climate.precipitation.total >= sp.precipitationMin;

    const presentSurvival = canSurvive(present);
    const survival2035 = canSurvive(future2035);
    const survival2045 = canSurvive(future2045);

    let status: BiodiversityProjection['status'] = 'stable';
    let migrationDistance = 0;

    if (presentSurvival && !survival2035) {
      status = 'at-risk';
      migrationDistance = 50 * (future2035.temperature.change / 2); // Rough estimate
    } else if (!presentSurvival && survival2035) {
      status = 'emerging';
    } else if (presentSurvival && survival2035 && !survival2045) {
      status = 'migrating';
      migrationDistance = 80 * (future2045.temperature.change / 3);
    }

    return {
      species: sp.species,
      commonName: sp.commonName,
      status,
      confidence: 0.75 + Math.random() * 0.2,
      climateThreshold: {
        tempMin: sp.tempMin,
        tempMax: sp.tempMax,
        precipitationMin: sp.precipitationMin
      },
      projection: {
        present: presentSurvival,
        year2035: survival2035,
        year2045: survival2045
      },
      migrationDistance: migrationDistance > 0 ? Math.round(migrationDistance) : undefined,
      story: sp.story
    };
  });
};

// Mock future soundscapes
const generateFutureSoundscapes = (biodiversityData: BiodiversityProjection[]): FutureSoundscape[] => {
  return [
    {
      year: 2025,
      scenario: 'present',
      species: biodiversityData.map(sp => ({
        name: sp.commonName,
        frequency: sp.projection.present ? 0.8 : 0.1,
        newSpecies: false
      })),
      soundCharacteristics: {
        diversity: 0.85,
        activity: 'dawn',
        dominantGroups: ['Passereaux', 'Rapaces']
      }
    },
    {
      year: 2035,
      scenario: '2035',
      species: biodiversityData.map(sp => ({
        name: sp.commonName,
        frequency: sp.projection.year2035 ? (sp.status === 'emerging' ? 0.6 : 0.7) : 0.2,
        newSpecies: sp.status === 'emerging'
      })),
      soundCharacteristics: {
        diversity: 0.75,
        activity: 'dawn',
        dominantGroups: ['Passereaux', 'Espèces méditerranéennes']
      }
    },
    {
      year: 2045,
      scenario: '2045',
      species: biodiversityData.map(sp => ({
        name: sp.commonName,
        frequency: sp.projection.year2045 ? (sp.status === 'emerging' ? 0.8 : 0.5) : 0.1,
        newSpecies: sp.status === 'emerging'
      })),
      soundCharacteristics: {
        diversity: 0.6,
        activity: 'dusk',
        dominantGroups: ['Espèces thermophiles', 'Migrateurs précoces']
      }
    }
  ];
};

export const useClimateProjections = (latitude: number, longitude: number) => {
  return useQuery({
    queryKey: ['climate-projections', latitude, longitude],
    queryFn: async () => {
      console.log('🌡️ Generating climate projections for:', { latitude, longitude });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const climateData = generateClimateProjections(latitude, longitude);
      const biodiversityData = generateBiodiversityProjections(climateData);
      const soundscapeData = generateFutureSoundscapes(biodiversityData);
      
      return {
        climateProjections: climateData,
        biodiversityProjections: biodiversityData,
        futureSoundscapes: soundscapeData,
        generatedAt: new Date().toISOString()
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: Boolean(latitude && longitude && latitude !== 0 && longitude !== 0),
  });
};