// Native platform maps - loads react-native-maps
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default || Maps;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
} catch (error) {
  // Silently fail if react-native-maps is not available
  MapView = null;
  Marker = null;
  PROVIDER_GOOGLE = null;
}

export { MapView, Marker, PROVIDER_GOOGLE };

