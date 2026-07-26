export type MapStyle = 'geopoetic' | 'satellite' | 'terrain' | 'cadastre';

export const TILE_CONFIGS: Record<MapStyle, { url: string; attribution: string; maxZoom?: number; className?: string }> = {
  geopoetic: {
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.fr/">OpenStreetMap France</a>',
    className: 'carte-tiles-dark',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
  cadastre: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap &middot; &copy; Etalab Cadastre',
    maxZoom: 19,
  },
};

export const CADASTRE_OVERLAY_URL = 'https://cadastre.data.gouv.fr/map/{z}/{x}/{y}.png';

export const POLYLINE_COLORS: Record<MapStyle, string> = {
  geopoetic: '#10b981',
  satellite: '#fbbf24',
  terrain: '#10b981',
  cadastre: '#0d6b58',
};

export const ARROW_COLORS: Record<MapStyle, string> = {
  geopoetic: '#10b981',
  satellite: '#fbbf24',
  terrain: '#10b981',
  cadastre: '#0d6b58',
};
