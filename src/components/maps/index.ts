export { default as DynamicTileLayer } from './DynamicTileLayer';
export { default as MapStyleToggle } from './MapStyleToggle';
export * from './mapStyles';

// Reusable map shell + primitives
export { default as RichMap } from './RichMap';
export type { RichMapProps, RichMapControls, RichMapMarcheRoute } from './RichMap';

// Controls
export { FitBounds } from './controls/FitBounds';
export { ZoomControls } from './controls/ZoomControls';
export {
  GeolocateControl,
  GeolocateButton,
  UserLocationMarker,
} from './controls/GeolocateControl';

// Layers
export {
  MarcheRouteLayer,
  ArrowDecorators,
  createNumberedIcon,
  type MarcheRouteStep,
} from './layers/MarcheRouteLayer';
