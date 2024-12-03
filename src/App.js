import React, { useEffect, useState } from 'react';
import MultiDayTimeline from './components/timeline/MultiDayTimeline';
import Sidebar from './components/sidebar/Sidebar';
import './App.css';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import MapWithMarkers from './components/map/MapWithMarkers';
import {
  fetchSheetData,
  parseEventData,
  parsePlaceData,
  createNewEvent,
  syncEvents,
} from './utils/eventUtils';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [events, setEvents] = useState([]);
  const [foodPlaces, setFoodPlaces] = useState([]);
  const [landmarkPlaces, setLandmarkPlaces] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedFoodId, setSelectedFoodId] = useState(null);
  const [selectedLandmarkId, setSelectedLandmarkId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const spreadsheetId = '1yTbALjVCCWi9tnW7W2Pq0sZrJAgdJqyCna55PYarfWo';

  const onAddEvent = (eventData, type) => {
    const newEvent = createNewEvent(eventData, type, selectedDay, events);
    setEvents((prevEvents) =>
      [...prevEvents, newEvent].sort((a, b) => a.startTime - b.startTime)
    );
  };

  const handleSync = () => {
    syncEvents(events);
  };

  const handleDaySelect = (day) => {
    setSelectedDay(day);
    setSelectedFoodId(null);
    setSelectedLandmarkId(null);
  };

  const handleEventSelect = (eventId) => {
    setSelectedEventId(eventId);
    setSelectedFoodId(null);
    setSelectedLandmarkId(null);
  };

  const handleFoodSelect = (foodId) => {
    setSelectedFoodId(foodId);
    setSelectedLandmarkId(null);
    setSelectedEventId(null);
  };

  const handleLandmarkSelect = (landmarkId) => {
    setSelectedLandmarkId(landmarkId);
    setSelectedFoodId(null);
    setSelectedEventId(null);
  };

  const handleEventUpdate = (updatedEvent) => {
    setEvents((prevEvents) =>
      prevEvents
        .map((event) => (event.id === updatedEvent.id ? { ...event, ...updatedEvent } : event))
        .sort((a, b) => a.startTime - b.startTime)
    );
  };

  const fetchData = async () => {
    try {
      // Fetch Events
      const eventRows = await fetchSheetData(apiKey, spreadsheetId, 'events!A:L');
      const eventData = parseEventData(eventRows);
      setEvents(eventData);

      // Fetch Food Places
      const foodRows = await fetchSheetData(apiKey, spreadsheetId, 'food!A:D');
      const foodData = parsePlaceData(foodRows);
      setFoodPlaces(foodData);

      // Fetch Landmark Places
      const landmarkRows = await fetchSheetData(apiKey, spreadsheetId, 'landmarks!A:D');
      const landmarkData = parsePlaceData(landmarkRows);
      setLandmarkPlaces(landmarkData);
    } catch (error) {
      console.error('Error fetching data', error);
    }
  };

  useEffect(() => {
    if (isApiKeySet) {
      fetchData();
    }
  }, [isApiKeySet]);

  const timelineConfig = {
    dayWidth: 'calc(25% - 2px)',
    fontSize: '12px',
    showLabels: true,
  };

  return (
    <div>
      {!isApiKeySet ? (
        <div className="api-key-form">
          <h2>Set API Key</h2>
          <input
            type="text"
            placeholder="Enter API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button onClick={() => setIsApiKeySet(Boolean(apiKey))}>Submit</button>
        </div>
      ) : (
        <DndProvider backend={HTML5Backend}>
          <div className="main-content">
            <div className="chart-container">
              <MultiDayTimeline
                events={events}
                setEvents={setEvents}
                config={timelineConfig}
                selectedEventId={selectedEventId}
                onEventSelect={handleEventSelect}
                onEventUpdate={handleEventUpdate}
                onSelectDay={handleDaySelect}
                selectedDay={selectedDay}
                apiKey={apiKey}
              />
            </div>
            <div className="sidebar-container">
              <MapWithMarkers
                events={events}
                foodPlaces={foodPlaces}
                landmarkPlaces={landmarkPlaces}
                selectedDay={selectedDay}
                selectedEventId={selectedEventId}
                selectedFoodId={selectedFoodId}
                selectedLandmarkId={selectedLandmarkId}
                onAddEvent={onAddEvent}
                apiKey={apiKey}
                handleSync={handleSync}
              />
              <Sidebar
                events={events}
                foodPlaces={foodPlaces}
                landmarkPlaces={landmarkPlaces}
                onEventSelect={handleEventSelect}
                onFoodSelect={handleFoodSelect}
                onLandmarkSelect={handleLandmarkSelect}
                selectedEventId={selectedEventId}
                selectedFoodId={selectedFoodId}
                selectedLandmarkId={selectedLandmarkId}
                onEventUpdate={handleEventUpdate}
              />
            </div>
          </div>
        </DndProvider>
      )}
    </div>
  );
}

export default App;
