
import { SearchResult } from '../pages/Index';

export const geocodeAddress = async (query: string): Promise<SearchResult> => {
  // Check if query looks like coordinates (lat,lon or lat lon)
  const coordRegex = /^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/;
  const coordMatch = query.match(coordRegex);
  
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);
    
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return {
        coordinates: [lat, lon],
        address: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
        region: 'France'
      };
    }
  }

  // Use Nominatim for geocoding
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=fr&limit=1`
  );
  
  if (!response.ok) {
    throw new Error('Geocoding failed');
  }
  
  const data = await response.json();
  
  if (data.length === 0) {
    throw new Error('No results found');
  }
  
  const result = data[0];
  return {
    coordinates: [parseFloat(result.lat), parseFloat(result.lon)],
    address: result.display_name,
    region: result.address?.state || 'France'
  };
};
