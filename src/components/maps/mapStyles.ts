export type MapStyle = 'geopoetic' | 'satellite' | 'terrain' | 'cadastre';

export const TILE_CONFIGS: Record<MapStyle, { url: string; attribution: string; maxZoom?: number; className?: string }> = {
  geopoetic: {
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.fr/">OpenStreetMap France</a>',
    maxZoom: 20,
    className: 'carte-tiles-dark',
  },
  satellite: {
    // Ortho IGN (Géoplateforme) : natif jusqu'à z21 sur la France
    url: 'https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
    attribution: '&copy; IGN — Géoplateforme (BD ORTHO)',
    maxZoom: 21,
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
