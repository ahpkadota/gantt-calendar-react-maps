// MapContainer.js
import React, { useRef, useState } from 'react';
import { GoogleMap } from '@react-google-maps/api';

const MapContainer = ({ children, onMapLoad }) => {
  const mapRef = useRef(null);
  const [mapState, setMapState] = useState({
    center: { lat: 0, lng: 0 },
    zoom: 12,
  });

  const handleMapIdle = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      setMapState({
        center: { lat: center.lat(), lng: center.lng() },
        zoom,
      });
    }
  };

  const handleMapLoad = (map) => {
    mapRef.current = map;
    if (onMapLoad) {
      onMapLoad(map);
    }
  };

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={mapState.center}
      zoom={mapState.zoom}
      onLoad={handleMapLoad}
      onIdle={handleMapIdle}
    >
      {children}
    </GoogleMap>
  );
};

export default MapContainer;
