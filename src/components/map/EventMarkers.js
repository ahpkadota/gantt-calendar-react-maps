// EventMarkers.js
import React from "react";
import {MarkerF} from "@react-google-maps/api";
import pinIcon from "../../assets/icon49.png";
import {getScaledSize, getEventLocations} from "../../utils/mapUtils";

const EventMarkers = ({events, selectedEventId}) => {
  return (
    <>
      {events.map((event, index) => {
        const locations = getEventLocations(event);
        const isSelected = event.id === selectedEventId;
        return locations.map((loc, idx) => (
          <MarkerF
            key={`event-${index}-${idx}`}
            position={loc}
            icon={{
              url: isSelected ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png" : pinIcon,
              scaledSize: getScaledSize(isSelected ? 24 : 12, isSelected ? 24 : 12),
            }}
          />
        ));
      })}
    </>
  );
};

export default EventMarkers;
