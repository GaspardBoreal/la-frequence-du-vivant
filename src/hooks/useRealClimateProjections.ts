import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClimateProjection, BiodiversityProjection, FutureSoundscape } from '../types/climate';

interface RealClimateData {
  temperature: {
    avg: number;
    min: number;
    max: number;
  };
  precipitation: {
    total: number;
    days: number;
  };
  humidity: {
    avg: number;
  };
  sunshine: {
    total: number | null;
  };
}

interface ClimateProjectionsResult {
  climateProjections: ClimateProjection[];
  biodiversityProjections: BiodiversityProjection[];
  futureSoundscapes: FutureSoundscape[];
  generatedAt: string;
  dataSource: 'real' | 'estimated';
  coordinates: { lat: number; lng: number };
}

// Calcul de l'altitude approximative basée sur les coordonnées (pour la France)
const estimateAltitude = (lat: number, lon: number): number => {
  // Mont-Dore : autour de 45.57°N, 2.81°E = ~1050m
  // Massif Central approximation
  if (lat >= 44.5 && lat <= 46 && lon >= 2.0 && lon <= 4.0) {
    // Distance au Mont-Dore (45.57, 2.81)
    const distToMontDore = Math.sqrt(Math.pow(lat - 45.57, 2) + Math.pow(lon - 2.81, 2));
    if (distToMontDore < 0.5) return 1050;
    if (distToMontDore < 1.0) return 800;
    if (distToMontDore < 1.5) return 500;
  }
  
  // Bordeaux/Dordogne région : très basse altitude
  if (lat >= 44.0 && lat <= 45.5 && lon >= -1.5 && lon <= 1.5) {
    return 10 + Math.abs(lon + 0.5) * 30; // Plus on va vers l'est, plus c'est élevé
  }
  
  // Défaut pour la France
  return 100;
};

// Calcul de la distance approximative à l'océan Atlantique
const calculateOceanDistance = (lon: number): number => {
  // Côte Atlantique française approximée à longitude -1.5
  const coastLongitude = -1.5;
  const kmPerDegree = 85; // Approximation à cette latitude
  return Math.max(0, (lon - coastLongitude) * kmPerDegree);
};

// Calculer les projections climatiques basées sur les vraies données
const calculateClimateProjections = (
  realData: RealClimateData,
  lat: number,
  lon: number
): ClimateProjection[] => {
  const altitude = estimateAltitude(lat, lon);
  const oceanDistance = calculateOceanDistance(lon);
  
  // Ajustements basés sur la géographie
  // Plus près de l'océan = plus tempéré, plus humide
  const oceanicFactor = Math.exp(-oceanDistance / 300); // Décroissance exponentielle
  
  // Jours de chaleur basés sur la température réelle et l'altitude
  const baseHeatDays = Math.max(0, Math.round((realData.temperature.avg - 10) * 4 - altitude / 50));
  const baseFrostDays = Math.max(0, Math.round(50 - realData.temperature.avg * 3 + altitude / 30));
  
  // Risque de sécheresse basé sur précipitations et température
  const calculateDroughtRisk = (temp: number, precip: number): 'low' | 'medium' | 'high' => {
    const ratio = precip / (temp + 10); // Indice simplifié
    if (ratio > 50) return 'low';
    if (ratio > 30) return 'medium';
    return 'high';
  };

  // Projection 2025 (présent) - données réelles
  const present: ClimateProjection = {
    year: 2025,
    scenario: 'present',
    temperature: {
      avg: Math.round(realData.temperature.avg * 10) / 10,
      min: Math.round(realData.temperature.min * 10) / 10,
      max: Math.round(realData.temperature.max * 10) / 10,
      change: 0
    },
    precipitation: {
      total: Math.round(realData.precipitation.total),
      change: 0
    },
    extremeEvents: {
      heatDays: baseHeatDays,
      frostDays: baseFrostDays,
      droughtRisk: calculateDroughtRisk(realData.temperature.avg, realData.precipitation.total)
    }
  };

  // Scénario 2035 - RCP 4.5 / SSP2-4.5
  // +1.5 à +2.0°C, -5 à -10% précipitations été, +10% hiver
  const tempChange2035 = 1.5 + (1 - oceanicFactor) * 0.5; // Moins de réchauffement près de l'océan
  const precipChange2035 = -8 + oceanicFactor * 5; // Moins de baisse près de l'océan
  
  const future2035: ClimateProjection = {
    year: 2035,
    scenario: '2035',
    temperature: {
      avg: Math.round((realData.temperature.avg + tempChange2035) * 10) / 10,
      min: Math.round((realData.temperature.min + tempChange2035 * 0.8) * 10) / 10,
      max: Math.round((realData.temperature.max + tempChange2035 * 1.3) * 10) / 10,
      change: Math.round(tempChange2035 * 10) / 10
    },
    precipitation: {
      total: Math.round(realData.precipitation.total * (1 + precipChange2035 / 100)),
      change: Math.round(precipChange2035)
    },
    extremeEvents: {
      heatDays: Math.round(baseHeatDays * 2.2),
      frostDays: Math.max(0, Math.round(baseFrostDays * 0.6)),
      droughtRisk: calculateDroughtRisk(realData.temperature.avg + tempChange2035, realData.precipitation.total * 0.92)
    }
  };

  // Scénario 2045 - RCP 8.5 / SSP5-8.5 (trajectoire pessimiste)
  // +2.5 à +3.5°C, -15 à -20% précipitations été
  const tempChange2045 = 2.8 + (1 - oceanicFactor) * 0.8;
  const precipChange2045 = -15 + oceanicFactor * 8;
  
  const future2045: ClimateProjection = {
    year: 2045,
    scenario: '2045',
    temperature: {
      avg: Math.round((realData.temperature.avg + tempChange2045) * 10) / 10,
      min: Math.round((realData.temperature.min + tempChange2045 * 0.7) * 10) / 10,
      max: Math.round((realData.temperature.max + tempChange2045 * 1.5) * 10) / 10,
      change: Math.round(tempChange2045 * 10) / 10
    },
    precipitation: {
      total: Math.round(realData.precipitation.total * (1 + precipChange2045 / 100)),
      change: Math.round(precipChange2045)
    },
    extremeEvents: {
      heatDays: Math.round(baseHeatDays * 3.5),
      frostDays: Math.max(0, Math.round(baseFrostDays * 0.3)),
      droughtRisk: calculateDroughtRisk(realData.temperature.avg + tempChange2045, realData.precipitation.total * 0.85)
    }
  };

  return [present, future2035, future2045];
};

// Biodiversity projections based on real climate data
const generateBiodiversityProjections = (
  climateData: ClimateProjection[],
  lat: number,
  lon: number
): BiodiversityProjection[] => {
  const altitude = estimateAltitude(lat, lon);
  const presentTemp = climateData[0].temperature.avg;
  
  // Espèces adaptées au contexte local
  const getLocalSpecies = () => {
    // Montagne (> 800m)
    if (altitude > 800) {
      return [
        {
          species: 'Monticola saxatilis',
          commonName: 'Merle de roche',
          tempMin: 2,
          tempMax: 20,
          precipitationMin: 800,
          story: "Espèce de montagne menacée par le réchauffement. Devra remonter en altitude."
        },
        {
          species: 'Anthus spinoletta',
          commonName: 'Pipit spioncelle',
          tempMin: -5,
          tempMax: 18,
          precipitationMin: 700,
          story: "Nicheur d'altitude, se raréfie à mesure que les températures augmentent."
        },
        {
          species: 'Prunella collaris',
          commonName: 'Accenteur alpin',
          tempMin: -10,
          tempMax: 15,
          precipitationMin: 600,
          story: "Emblème des hauts sommets, habitat réduit chaque décennie."
        },
        {
          species: 'Pyrrhocorax pyrrhocorax',
          commonName: 'Crave à bec rouge',
          tempMin: 0,
          tempMax: 22,
          precipitationMin: 500,
          story: "S'adapte en exploitant de nouvelles ressources alimentaires."
        }
      ];
    }
    
    // Climat océanique (proche Atlantique)
    if (lon < 0) {
      return [
        {
          species: 'Cettia cetti',
          commonName: 'Bouscarle de Cetti',
          tempMin: 0,
          tempMax: 30,
          precipitationMin: 600,
          story: "Bénéficiaire du réchauffement, expansion vers le nord depuis 20 ans."
        },
        {
          species: 'Alcedo atthis',
          commonName: 'Martin-pêcheur d\'Europe',
          tempMin: -5,
          tempMax: 28,
          precipitationMin: 500,
          story: "Sensible aux hivers rigoureux mais favorisé par leur raréfaction."
        },
        {
          species: 'Ardea cinerea',
          commonName: 'Héron cendré',
          tempMin: -10,
          tempMax: 32,
          precipitationMin: 400,
          story: "Espèce adaptable, présence stable mais territoires de pêche menacés."
        },
        {
          species: 'Remiz pendulinus',
          commonName: 'Rémiz penduline',
          tempMin: 0,
          tempMax: 28,
          precipitationMin: 400,
          story: "Nicheur des zones humides, dépendant de la disponibilité en eau."
        }
      ];
    }
    
    // Continental / vallée
    return [
      {
        species: 'Parus major',
        commonName: 'Mésange charbonnière',
        tempMin: -15,
        tempMax: 28,
        precipitationMin: 400,
        story: "Espèce très adaptable, modifie ses dates de reproduction."
      },
      {
        species: 'Hirundo rustica',
        commonName: 'Hirondelle rustique',
        tempMin: 5,
        tempMax: 35,
        precipitationMin: 300,
        story: "Arrivée précoce de 2 semaines, sécheresses en Afrique inquiétantes."
      },
      {
        species: 'Upupa epops',
        commonName: 'Huppe fasciée',
        tempMin: 8,
        tempMax: 38,
        precipitationMin: 200,
        story: "Grande gagnante du réchauffement, expansion territoriale."
      },
      {
        species: 'Merops apiaster',
        commonName: 'Guêpier d\'Europe',
        tempMin: 12,
        tempMax: 40,
        precipitationMin: 150,
        story: "Colonise progressivement le nord, nouvelles colonies chaque année."
      }
    ];
  };

  const species = getLocalSpecies();

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
      migrationDistance = Math.round(50 * future2035.temperature.change);
    } else if (!presentSurvival && survival2035) {
      status = 'emerging';
    } else if (presentSurvival && survival2035 && !survival2045) {
      status = 'migrating';
      migrationDistance = Math.round(30 * future2045.temperature.change);
    } else if (presentSurvival && survival2035 && survival2045) {
      // Espèce thermophile qui bénéficie
      if (sp.tempMax > 30) {
        status = 'emerging';
      }
    }

    return {
      species: sp.species,
      commonName: sp.commonName,
      status,
      confidence: 0.70 + Math.random() * 0.25,
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
      migrationDistance: migrationDistance > 0 ? migrationDistance : undefined,
      story: sp.story
    };
  });
};

// Future soundscapes based on biodiversity projections
const generateFutureSoundscapes = (
  biodiversityData: BiodiversityProjection[],
  lat: number,
  lon: number
): FutureSoundscape[] => {
  const altitude = estimateAltitude(lat, lon);
  
  const getDominantGroups = (year: number) => {
    if (altitude > 800) {
      if (year === 2025) return ['Passereaux alpins', 'Rapaces'];
      if (year === 2035) return ['Passereaux montagnards', 'Espèces en altitude'];
      return ['Généralistes', 'Espèces thermophiles en expansion'];
    }
    
    if (lon < 0) {
      if (year === 2025) return ['Passereaux paludicoles', 'Limicoles'];
      if (year === 2035) return ['Espèces aquatiques', 'Migrateurs'];
      return ['Espèces méditerranéennes', 'Adaptés sécheresse'];
    }
    
    if (year === 2025) return ['Passereaux', 'Rapaces diurnes'];
    if (year === 2035) return ['Passereaux', 'Espèces thermophiles'];
    return ['Espèces méditerranéennes', 'Migrateurs précoces'];
  };

  return [
    {
      year: 2025,
      scenario: 'present',
      species: biodiversityData.map(sp => ({
        name: sp.commonName,
        frequency: sp.projection.present ? 0.75 + Math.random() * 0.2 : 0.1,
        newSpecies: false
      })),
      soundCharacteristics: {
        diversity: 0.80 + Math.random() * 0.1,
        activity: 'dawn',
        dominantGroups: getDominantGroups(2025)
      }
    },
    {
      year: 2035,
      scenario: '2035',
      species: biodiversityData.map(sp => ({
        name: sp.commonName,
        frequency: sp.projection.year2035 
          ? (sp.status === 'emerging' ? 0.6 + Math.random() * 0.2 : 0.65 + Math.random() * 0.15) 
          : 0.15 + Math.random() * 0.1,
        newSpecies: sp.status === 'emerging'
      })),
      soundCharacteristics: {
        diversity: 0.70 + Math.random() * 0.1,
        activity: 'dawn',
        dominantGroups: getDominantGroups(2035)
      }
    },
    {
      year: 2045,
      scenario: '2045',
      species: biodiversityData.map(sp => ({
        name: sp.commonName,
        frequency: sp.projection.year2045 
          ? (sp.status === 'emerging' ? 0.75 + Math.random() * 0.2 : 0.45 + Math.random() * 0.2) 
          : 0.05 + Math.random() * 0.1,
        newSpecies: sp.status === 'emerging'
      })),
      soundCharacteristics: {
        diversity: 0.55 + Math.random() * 0.1,
        activity: 'dusk', // Chaleur → activité décalée
        dominantGroups: getDominantGroups(2045)
      }
    }
  ];
};

export const useRealClimateProjections = (latitude: number, longitude: number) => {
  return useQuery({
    queryKey: ['real-climate-projections', latitude, longitude],
    queryFn: async (): Promise<ClimateProjectionsResult> => {
      console.log('🌡️ Fetching REAL climate data for:', { latitude, longitude });
      
      try {
        // Appel à l'edge function Open-Meteo pour les vraies données
        const { data, error } = await supabase.functions.invoke('open-meteo-data', {
          body: {
            latitude,
            longitude,
            days: 365, // Dernière année
            includeClimate: true
          }
        });

        if (error) {
          console.error('❌ Open-Meteo API error:', error);
          throw error;
        }

        if (!data?.success || !data?.data?.aggregated) {
          console.warn('⚠️ No valid data from Open-Meteo, using estimations');
          throw new Error('Invalid Open-Meteo response');
        }

        const aggregated = data.data.aggregated;
        
        // Extrapoler les précipitations annuelles à partir des données disponibles
        const daysOfData = aggregated.period.days || 30;
        const annualPrecipitation = (aggregated.precipitation.total / daysOfData) * 365;

        const realData: RealClimateData = {
          temperature: {
            avg: aggregated.temperature.avg,
            min: aggregated.temperature.min,
            max: aggregated.temperature.max
          },
          precipitation: {
            total: annualPrecipitation,
            days: Math.round((aggregated.precipitation.days / daysOfData) * 365)
          },
          humidity: {
            avg: aggregated.humidity.avg
          },
          sunshine: {
            total: aggregated.sunshine.total
          }
        };

        console.log('✅ Real climate data retrieved:', {
          avgTemp: realData.temperature.avg.toFixed(1),
          annualPrecip: Math.round(realData.precipitation.total),
          location: `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`
        });

        const climateProjections = calculateClimateProjections(realData, latitude, longitude);
        const biodiversityProjections = generateBiodiversityProjections(climateProjections, latitude, longitude);
        const futureSoundscapes = generateFutureSoundscapes(biodiversityProjections, latitude, longitude);

        return {
          climateProjections,
          biodiversityProjections,
          futureSoundscapes,
          generatedAt: new Date().toISOString(),
          dataSource: 'real',
          coordinates: { lat: latitude, lng: longitude }
        };

      } catch (fetchError) {
        console.warn('⚠️ Falling back to geographic estimation:', fetchError);
        
        // Fallback : estimation basée sur la géographie
        const altitude = estimateAltitude(latitude, longitude);
        const oceanDistance = calculateOceanDistance(longitude);
        
        // Estimation réaliste basée sur la position géographique
        const latitudeEffect = (latitude - 46) * -0.6; // Plus au sud = plus chaud
        const altitudeEffect = altitude * -0.0065; // -0.65°C / 100m
        const oceanEffect = Math.exp(-oceanDistance / 300) * 2; // Effet modérateur océan
        
        const estimatedTemp = 12.5 + latitudeEffect + altitudeEffect + oceanEffect;
        const estimatedPrecip = 700 + Math.exp(-oceanDistance / 200) * 300 + altitude * 0.5;

        const estimatedData: RealClimateData = {
          temperature: {
            avg: estimatedTemp,
            min: estimatedTemp - 15,
            max: estimatedTemp + 18
          },
          precipitation: {
            total: estimatedPrecip,
            days: Math.round(estimatedPrecip / 6)
          },
          humidity: { avg: 75 },
          sunshine: { total: null }
        };

        console.log('📊 Using geographic estimation:', {
          avgTemp: estimatedTemp.toFixed(1),
          precip: Math.round(estimatedPrecip),
          altitude,
          oceanDistance: Math.round(oceanDistance)
        });

        const climateProjections = calculateClimateProjections(estimatedData, latitude, longitude);
        const biodiversityProjections = generateBiodiversityProjections(climateProjections, latitude, longitude);
        const futureSoundscapes = generateFutureSoundscapes(biodiversityProjections, latitude, longitude);

        return {
          climateProjections,
          biodiversityProjections,
          futureSoundscapes,
          generatedAt: new Date().toISOString(),
          dataSource: 'estimated',
          coordinates: { lat: latitude, lng: longitude }
        };
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (données plus stables)
    gcTime: 60 * 60 * 1000, // 1 heure
    enabled: Boolean(latitude && longitude && latitude !== 0 && longitude !== 0),
  });
};
