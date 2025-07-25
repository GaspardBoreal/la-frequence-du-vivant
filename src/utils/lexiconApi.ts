
export const fetchParcelData = async (latitude: number, longitude: number) => {
  const response = await fetch(
    `https://comediedesmondeshybrides-data-api.hf.space/tools/parcel-identifier?latitude=${latitude}&longitude=${longitude}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch parcel data');
  }
  
  return response.json();
};
