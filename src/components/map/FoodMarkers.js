// FoodMarkers.js
import React from "react";
import {MarkerF} from "@react-google-maps/api";
import pinIcon from '../../assets/hamburger.png';

const FoodMarkers = ({foodPlaces, onFoodPlaceSelect}) => {
  return (
    <>
      {foodPlaces.map((place, index) => {
        const [lat, lng] = place.coordinates || [];
        if (lat && lng) {
          return (
            <MarkerF
              key={`food-${index}`}
              position={{lat, lng}}
              onClick={() => onFoodPlaceSelect(place)}
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

export default FoodMarkers;
