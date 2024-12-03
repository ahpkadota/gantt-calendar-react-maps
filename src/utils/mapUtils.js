// mapUtils.js

export const calculateBounds = (locations) => {
    const bounds = new window.google.maps.LatLngBounds();
    locations.forEach((location) => {
      bounds.extend(location);
    });
    return bounds;
  };
  
  export const getScaledSize = (width, height) => {
    return window.google?.maps?.Size ? new window.google.maps.Size(width, height) : null;
  };
  
  export const parseLocationString = (locationString) => {
    return locationString.split(',').map(Number);
  };
  
  export const getEventLocations = (event) => {
    const locations = [];
    if (event.location) {
      const [lat, lng] = parseLocationString(event.location);
      locations.push({ lat, lng });
    }
    if (event.endLocation) {
      const [lat, lng] = parseLocationString(event.endLocation);
      locations.push({ lat, lng });
    }
    return locations;
  };
  