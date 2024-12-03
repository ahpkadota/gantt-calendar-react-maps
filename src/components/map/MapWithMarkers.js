// MapWithMarkers.js
import React, {useMemo, useEffect, useState} from "react";
import {LoadScript, InfoWindowF} from "@react-google-maps/api";
import MapContainer from "./MapContainer";
import EventMarkers from "./EventMarkers";
import FoodMarkers from "./FoodMarkers";
import Polylines from "./Polylines";
import FoodToggle from "./FoodToggle";
import {calculateBounds, parseLocationString} from "../../utils/mapUtils";
import LandmarkMarkers from "./LandmarkMarkers";

const MapWithMarkers = ({
  events,
  foodPlaces,
  landmarkPlaces,
  selectedDay,
  selectedEventId,
  selectedFoodId,
  selectedLandmarkId,
  onAddEvent,
  apiKey,
  handleSync
}) => {
  const [mapInstance, setMapInstance] = useState(null);
  const [showFood, setShowFood] = useState(false);
  const [showLandmark, setShowLandmark] = useState(false);
  const [selectedFoodPlace, setSelectedFoodPlace] = useState(null);
  const [selectedLandmarkPlace, setSelectedLandmarkPlace] = useState(null);

  // Filter events for the selected day
  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return events;
    return events.filter((event) => event.startTime?.toLocaleDateString() === selectedDay.toLocaleDateString());
  }, [events, selectedDay]);

  // Extract locations for selectedDay events and all events
  const selectedDayLocations = useMemo(() => {
    // Find the last location of the previous day
    const previousDay = new Date(selectedDay);
    previousDay.setDate(previousDay.getDate() - 1);

    const previousDayEvents = events.filter(
      (event) => event.startTime?.toLocaleDateString() === previousDay.toLocaleDateString()
    );

    let lastPreviousLocation = null;
    if (previousDayEvents.length > 0) {
      const lastEvent = previousDayEvents[previousDayEvents.length - 1];
      if (lastEvent.endLocation) {
        const [endLat, endLng] = lastEvent.endLocation.split(",").map(Number);
        lastPreviousLocation = {lat: endLat, lng: endLng};
      } else if (lastEvent.location) {
        const [lat, lng] = lastEvent.location.split(",").map(Number);
        lastPreviousLocation = {lat, lng};
      }
    }

    // Build locations for the selected day
    const dayLocations = selectedDayEvents.flatMap((event) => {
      const locations = [];
      if (event.location) {
        const [lat, lng] = event.location.split(",").map(Number);
        locations.push({lat, lng});
      }
      if (event.endLocation) {
        const [endLat, endLng] = event.endLocation.split(",").map(Number);
        locations.push({lat: endLat, lng: endLng});
      }
      return locations;
    });

    // Prepend the last location of the previous day if it exists
    if (lastPreviousLocation) {
      return [lastPreviousLocation, ...dayLocations];
    }

    return dayLocations;
  }, [events, selectedDay, selectedDayEvents]);

  const allLocations = useMemo(() => {
    return events.flatMap((event) => {
      const locations = [];
      if (event.location) {
        const [lat, lng] = event.location.split(",").map(Number);
        locations.push({lat, lng});
      }
      if (event.endLocation) {
        const [endLat, endLng] = event.endLocation.split(",").map(Number);
        locations.push({lat: endLat, lng: endLng});
      }
      return locations;
    });
  }, [events]);

  // Selected event location
  const selectedEventLocation = useMemo(() => {
    const event = events.find((e) => e.id === selectedEventId && e.location);
    if (event && event.location) {
      const [lat, lng] = parseLocationString(event.location);
      return {lat, lng};
    }
    return null;
  }, [events, selectedEventId]);

  // Selected food location
  const selectedFoodLocation = useMemo(() => {
    const food = foodPlaces.find((e) => e.title === selectedFoodId && e.coordinates);
    if (food && food.coordinates) {
      const [lat, lng] = food.coordinates.map(Number);
      return {lat, lng};
    }
    return null;
  }, [foodPlaces, selectedFoodId]);

  // Selected food location
  const selectedLandmarkLocation = useMemo(() => {
    const landmark = landmarkPlaces.find((e) => e.title === selectedLandmarkId && e.coordinates);
    if (landmark && landmark.coordinates) {
      const [lat, lng] = landmark.coordinates.map(Number);
      return {lat, lng};
    }
    return null;
  }, [landmarkPlaces, selectedLandmarkId]);

  useEffect(() => {
    if (mapInstance) {
      const bounds = calculateBounds(selectedDay ? selectedDayLocations : allLocations);
      mapInstance.fitBounds(bounds);

      if (selectedEventLocation) {
        mapInstance.panTo(selectedEventLocation);
        mapInstance.setZoom(15);
      } else if (selectedFoodLocation) {
        mapInstance.panTo(selectedFoodLocation);
        mapInstance.setZoom(15);
      } else if (selectedLandmarkLocation) {
        mapInstance.panTo(selectedLandmarkLocation);
        mapInstance.setZoom(15);
      }
    }
  }, [
    mapInstance,
    selectedDay,
    selectedDayLocations,
    allLocations,
    selectedEventLocation,
    selectedFoodLocation,
    selectedLandmarkLocation,
  ]);

  const handleMapLoad = (map) => {
    setMapInstance(map);
  };

  const handleFoodToggle = () => {
    setShowFood((prev) => !prev);
  };
  const handleLandmarkToggle = () => {
    setShowLandmark((prev) => !prev);
  };

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <FoodToggle
        showFood={showFood}
        showLandmark={showLandmark}
        foodToggle={handleFoodToggle}
        landmarkToggle={handleLandmarkToggle}
        handleSync={handleSync}
      />
      <MapContainer onMapLoad={handleMapLoad}>
        <EventMarkers events={events} selectedEventId={selectedEventId}/>
        {/* Polylines for Selected Day or All Events */}
        <Polylines
          locations={selectedDay ? selectedDayLocations : allLocations}
          options={{
            strokeColor: selectedDay ? "#FF0000" : "#0000FF55",
            strokeOpacity: selectedDay ? 1 : 0.8,
            strokeWeight: 3,
            zIndex: selectedDay ? 999 : undefined,
            icons: selectedDay
              ? [
                  {
                    icon: {
                      path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                      scale: 3,
                      strokeColor: "#FF0000",
                    },
                    offset: "100%",
                  },
                ]
              : undefined,
          }}
        />
        <Polylines
          locations={allLocations}
          options={{
            strokeColor: "#0000FF55",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            zIndex: 1,
          }}
        />
        {/* Food Markers */}
        {showFood && <FoodMarkers foodPlaces={foodPlaces} onFoodPlaceSelect={setSelectedFoodPlace} />}
        {/* Food InfoWindow */}
        {selectedFoodPlace && (
          <InfoWindowF
            position={{
              lat: selectedFoodPlace.coordinates[0],
              lng: selectedFoodPlace.coordinates[1],
            }}
            onCloseClick={() => setSelectedFoodPlace(null)}
          >
            <div>
              <strong>{selectedFoodPlace.title}</strong>
              <br />
              <a href={selectedFoodPlace.website} target="_blank" rel="noopener noreferrer">
                {selectedFoodPlace.website}
              </a>
              <br />
              {/* Add Event Button */}
              <button
                onClick={() => {
                  onAddEvent(selectedFoodPlace, "Food");
                  setSelectedFoodPlace(null); // Close the InfoWindow after adding
                }}
              >
                Add Event
              </button>
            </div>
          </InfoWindowF>
        )}
        {/* Landmark Markers */}
        {showLandmark && (
          <LandmarkMarkers landmarkPlaces={landmarkPlaces} onLandmarkPlaceSelect={setSelectedLandmarkPlace} />
        )}
        {/* Landmark InfoWindow */}
        {selectedLandmarkPlace && (
          <InfoWindowF
            position={{
              lat: selectedLandmarkPlace.coordinates[0],
              lng: selectedLandmarkPlace.coordinates[1],
            }}
            onCloseClick={() => setSelectedLandmarkPlace(null)}
          >
            <div>
              <strong>{selectedLandmarkPlace.title}</strong>
              <br />
              <a href={selectedLandmarkPlace.website} target="_blank" rel="noopener noreferrer">
                {selectedLandmarkPlace.website}
              </a>
              <br />
              {/* Add Event Button */}
              <button
                onClick={() => {
                  onAddEvent(selectedLandmarkPlace, "Landmark");
                  setSelectedLandmarkPlace(null); // Close the InfoWindow after adding
                }}
              >
                Add Event
              </button>
            </div>
          </InfoWindowF>
        )}
      </MapContainer>
    </LoadScript>
  );
};

export default MapWithMarkers;
