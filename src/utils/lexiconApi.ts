
export const fetchParcelData = async (latitude: number, longitude: number) => {
  const response = await fetch(
    `https://lexicon.osfarm.org/tools/parcel-identifier.json?latitude=${latitude}&longitude=${longitude}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch parcel data');
  }
  
  return response.json();
};
