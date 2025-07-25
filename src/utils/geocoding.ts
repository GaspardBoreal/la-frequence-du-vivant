
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export const geocodeAddress = async (address: string) => {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(address)}&limit=5&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
};

export const parseCoordinates = (input: string): [number, number] | null => {
  // Remove whitespace and split by comma
  const cleaned = input.trim().replace(/\s+/g, '');
  
  // Try different coordinate formats
  const patterns = [
    /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/, // 43.3, -0.29
    /^(-?\d+\.?\d*)\s+(-?\d+\.?\d*)$/, // 43.3 -0.29
    /^(-?\d+\.?\d*);(-?\d+\.?\d*)$/, // 43.3;-0.29
  ];
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      
      // Validate coordinate ranges
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return [lat, lng];
      }
    }
  }
  
  return null;
};
