
export const fetchParcelData = async (latitude: number, longitude: number) => {
  const response = await fetch(
    `https://comediedesmondeshybrides-data-api.hf.space/tools/parcel-identifier?latitude=${latitude}&longitude=${longitude}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch parcel data');
  }
  
  return response.json();
};

export const fetchNearbyParcels = async (
  latitude: number, 
  longitude: number, 
  radiusM: number, 
  stepM: number
) => {
  const response = await fetch(
    `https://comediedesmondeshybrides-data-api.hf.space/tools/get_nearby_parcel?latitude=${latitude}&longitude=${longitude}&radius_m=${radiusM}&step_m=${stepM}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch nearby parcels data');
  }
  
  return response.json();
};
