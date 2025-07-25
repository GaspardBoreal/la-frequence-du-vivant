
const LEXICON_BASE_URL = 'https://lexicon.osfarm.org';

export const fetchParcelData = async (latitude: number, longitude: number) => {
  try {
    console.log(`Fetching parcel data for: ${latitude}, ${longitude}`);
    
    const response = await fetch(
      `${LEXICON_BASE_URL}/tools/parcel-identifier.json?latitude=${latitude}&longitude=${longitude}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Parcel data received:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching parcel data:', error);
    throw error;
  }
};

export const fetchWeatherData = async (stationId: string) => {
  try {
    console.log(`Fetching weather data for station: ${stationId}`);
    
    const response = await fetch(
      `${LEXICON_BASE_URL}/weather/stations/${stationId}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Weather data received:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};
