export type MapStyle = 'geopoetic' | 'satellite' | 'terrain' | 'cadastre';

export const TILE_CONFIGS: Record<
  MapStyle,
  { url: string; attribution: string; maxZoom?: number; className?: string; label?: string }
> = {
  geopoetic: {
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.fr/">OpenStreetMap France</a>',
    // OSM France sert jusqu'à z19 de façon fiable ; au-delà on agrandit.
    maxZoom: 19,
    className: 'carte-tiles-dark',
    label: 'OSM France',
  },
  satellite: {
    // Ortho IGN (Géoplateforme). Le natif varie selon les communes : beaucoup
    // s'arrêtent à z19 et renvoient 404 en z20/z21 — d'où l'écran noir si on
    // déclare z21 partout. On part de z19 et on relaye au-delà.
    url: 'https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
    attribution: '&copy; IGN — Géoplateforme (BD ORTHO)',
    maxZoom: 19,
    label: 'IGN BD ORTHO',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
    label: 'OpenTopoMap',
  },
  cadastre: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap &middot; &copy; Etalab Cadastre',
    maxZoom: 19,
    label: 'OSM · Cadastre',
  },
};

export const CADASTRE_OVERLAY_URL = 'https://cadastre.data.gouv.fr/map/{z}/{x}/{y}.png';

/**
 * Relais mondial posé SOUS l'ortho IGN : il couvre les niveaux que l'IGN ne
 * sert pas (z20/z21 selon les communes) pour que le fond ne soit jamais noir.
 */
export const SATELLITE_RELAY = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution: '&copy; Esri — World Imagery',
  maxNativeZoom: 21,
  label: 'Esri World Imagery',
};


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
