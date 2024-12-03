// LandmarkMarkers.js
import React from 'react';
import { MarkerF } from '@react-google-maps/api';
import pinIcon from '../../assets/torii-gate.png';

const LandmarkMarkers = ({ landmarkPlaces, onLandmarkPlaceSelect }) => {
  return (
    <>
      {landmarkPlaces.map((place, index) => {
        const [lat, lng] = place.coordinates || [];
        if (lat && lng) {
          return (
            <MarkerF
              key={`landmark-${index}`}
              position={{ lat, lng }}
              onClick={() => onLandmarkPlaceSelect(place)}
              icon={{
                url: pinIcon,
                scaledSize: new window.google.maps.Size(20, 20),
              }}
            />
          );
        }
        return null;
      })}
    </>
  );
};

export default LandmarkMarkers;
