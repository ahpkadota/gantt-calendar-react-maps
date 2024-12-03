// utils/eventUtils.js
import axios from "axios";
import {parse} from "date-fns";
import CalendarEvent from "../models/CalendarEvent";

export const fetchSheetData = async (apiKey, spreadsheetId, sheetName) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${apiKey}`;
  try {
    const response = await axios.get(url);
    return response.data.values;
  } catch (error) {
    console.error(`Error fetching data from sheet ${sheetName}`, error);
    throw error;
  }
};

export const parseEventData = (eventRows) => {
  return eventRows.slice(1).map((row, index) => CalendarEvent.fromRow(row, parseDateTime, index));
};

export const parsePlaceData = (placeRows) => {
  return placeRows.slice(1).map((row) => ({
    title: row[0],
    website: row[1],
    location: row[2],
    coordinates: row[3]?.split(",").map(Number) || null,
  }));
};

export const createNewEvent = (eventData, type, selectedDay, events) => {
  let eventDate;
  if (selectedDay) {
    eventDate = new Date(selectedDay);
  } else if (events.length > 0) {
    eventDate = new Date(events[0].startTime);
  } else {
    eventDate = new Date();
  }

  const newStartTime = new Date(eventDate);
  newStartTime.setHours(7, 0, 0, 0);

  const newEndTime = new Date(eventDate);
  newEndTime.setHours(8, 0, 0, 0);

  return new CalendarEvent({
    id: Date.now(),
    title: eventData.title || "New Event",
    description: eventData.description || "",
    type: type,
    website: eventData.website || "",
    startTime: newStartTime,
    endTime: newEndTime,
    location: eventData.coordinates ? eventData.coordinates.join(",") : "",
    endLocation: "",
    guests: [],
    address: eventData.location || "",
    endAddress: "",
  });
};

export const syncEvents = async (events) => {
  try {
    const response = await fetch("https://synctogooglesheet-4gsosplf7q-uc.a.run.app", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({data: {events}}),
    });

    const result = await response.json();
    if (response.ok && result.success) {
      alert("Data synced successfully!");
    } else {
      alert("Failed to sync data.");
    }
  } catch (error) {
    console.error("Error syncing data:", error);
    alert("Error syncing data. Check console for details.");
  }
};

export const splitEventsByDay = (events) => {
  const dayEvents = {};

  if (events.length === 0) {
    return dayEvents; // Return empty object if no events
  }

  // Step 1: Find the earliest start date and latest end date
  let earliestDate = new Date(events[0].startTime);
  let latestDate = new Date(events[0].endTime);

  events.forEach((event) => {
    if (event.startTime < earliestDate) {
      earliestDate = new Date(event.startTime);
    }
    if (event.endTime > latestDate) {
      latestDate = new Date(event.endTime);
    }
  });

  // Normalize earliestDate and latestDate to start and end of the day
  earliestDate.setHours(0, 0, 0, 0);
  latestDate.setHours(0, 0, 0, 0);

  // Step 2: Generate all dates between earliestDate and latestDate
  const allDates = [];
  let currentDate = new Date(earliestDate);

  while (currentDate <= latestDate) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const day = String(currentDate.getDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`; // Using 'YYYY-MM-DD' format for consistency

    dayEvents[dateKey] = []; // Initialize with empty array

    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Step 3: Populate dayEvents with events
  events.forEach((event) => {
    const startDate = new Date(event.startTime.getFullYear(), event.startTime.getMonth(), event.startTime.getDate());
    const endDate = new Date(event.endTime.getFullYear(), event.endTime.getMonth(), event.endTime.getDate());

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;

      let dayStartTime = new Date(date);
      let dayEndTime = new Date(date);

      if (date.toDateString() === startDate.toDateString()) {
        dayStartTime = new Date(event.startTime);
      } else {
        dayStartTime.setHours(0, 0, 0, 0);
      }

      if (date.toDateString() === endDate.toDateString()) {
        dayEndTime = new Date(event.endTime);
      } else {
        dayEndTime.setHours(23, 59, 59, 999);
      }

      dayEvents[dateKey].push({
        ...event,
        startTime: dayStartTime,
        endTime: dayEndTime,
        isFirstDay: date.toDateString() === startDate.toDateString(),
        isLastDay: date.toDateString() === endDate.toDateString(),
        originalId: event.originalId || event.id, // Ensure originalId is set
        originalStartTime: event.startTime,
        originalEndTime: event.endTime,
      });
    }
  });
  return dayEvents;
};

export const calculateNewTime = (mouseY, containerHeight, currentTime) => {
  const minutes = Math.round(((mouseY / containerHeight) * 1440) / 15) * 15; // Round to nearest 15 minutes
  const newTime = new Date(currentTime);
  newTime.setHours(0, minutes, 0, 0);
  return newTime;
};

export const adjustTimeForBoundary = (minutes, currentTime, direction) => {
  const newTime = new Date(currentTime);
  if (direction === "previousDay" && minutes < 0) {
    newTime.setDate(newTime.getDate() - 1);
    newTime.setHours(23, 59, 0, 0);
    return newTime;
  } else if (direction === "nextDay" && minutes > 1440) {
    newTime.setDate(newTime.getDate() + 1);
    newTime.setHours(0, 0, 0, 0);
    return newTime;
  }
  return null;
};

export const calculateResize = ({mouseY, containerHeight, resizing, currentTime, oppositeTime}) => {
  let newMinutes = (mouseY / containerHeight) * 1440; // Total minutes in a day
  newMinutes = Math.round(newMinutes / 15) * 15; // Round to nearest 15 minutes

  if (resizing === "top") {
    const endMinutes = oppositeTime.getHours() * 60 + oppositeTime.getMinutes();
    const minimumDuration = 15; // Minimum event duration in minutes
    newMinutes = Math.min(newMinutes, endMinutes - minimumDuration);

    const adjustedTime = adjustTimeForBoundary(newMinutes, currentTime, "previousDay");
    return adjustedTime || calculateNewTime(mouseY, containerHeight, currentTime);
  } else if (resizing === "bottom") {
    const startMinutes = oppositeTime.getHours() * 60 + oppositeTime.getMinutes();
    const minimumDuration = 15;
    newMinutes = Math.max(newMinutes, startMinutes + minimumDuration);

    const adjustedTime = adjustTimeForBoundary(newMinutes, currentTime, "nextDay");
    return adjustedTime || calculateNewTime(mouseY, containerHeight, currentTime);
  }

  return null;
};

export const handleMouseMoveUtil = ({
  e,
  resizing,
  eventRef,
  tempStartTime,
  tempEndTime,
  setTempStartTime,
  setTempEndTime,
}) => {
  if (!eventRef.current || !resizing) return;

  e.preventDefault();

  const container = eventRef.current.parentElement;
  const containerRect = container.getBoundingClientRect();
  const containerHeight = containerRect.height;

  const mouseY = e.clientY - containerRect.top;
  let newMinutes = (mouseY / containerHeight) * 1440;
  newMinutes = Math.round(newMinutes / 15) * 15;

  if (resizing === "top") {
    const minimumDuration = 15;
    newMinutes = Math.min(newMinutes, tempEndTime.getHours() * 60 + tempEndTime.getMinutes() - minimumDuration);

    const newStartTime =
      adjustTimeForBoundary(newMinutes, tempStartTime, "previousDay") ||
      calculateNewTime(mouseY, containerHeight, tempStartTime);
    setTempStartTime(newStartTime);
  } else if (resizing === "bottom") {
    const minimumDuration = 15;
    newMinutes = Math.max(newMinutes, tempStartTime.getHours() * 60 + tempStartTime.getMinutes() + minimumDuration);

    const newEndTime =
      adjustTimeForBoundary(newMinutes, tempEndTime, "nextDay") ||
      calculateNewTime(mouseY, containerHeight, tempEndTime);
    setTempEndTime(newEndTime);
  }
};

export const handleMouseUpUtil = ({resizing, tempStartTime, tempEndTime, event, onEventResize, setResizing}) => {
  if (!resizing) return;

  let newStartTime = new Date(event.originalStartTime);
  let newEndTime = new Date(event.originalEndTime);

  if (resizing === "top") {
    const timeDiff = tempStartTime - event.startTime;
    newStartTime = new Date(event.originalStartTime.getTime() + timeDiff);
  } else if (resizing === "bottom") {
    const timeDiff = tempEndTime - event.endTime;
    newEndTime = new Date(event.originalEndTime.getTime() + timeDiff);
  }

  onEventResize(event.originalId, newStartTime, newEndTime);
  setResizing(null);
};

export const formatTimeRange = (startTime, endTime, title) =>
  `${startTime.getHours()}:${startTime.getMinutes().toString().padStart(2, "0")}-${endTime.getHours()}:${endTime
    .getMinutes()
    .toString()
    .padStart(2, "0")}  ${title}`;

export const computeEventPositions = (events) => {
  // Initialize
  let eventPositions = [];

  // Sort events by start time
  let sortedEvents = events.slice().sort((a, b) => a.startTime - b.startTime);

  let slots = []; // array of end times for each slot

  sortedEvents.forEach((event) => {
    let placed = false;
    for (let i = 0; i < slots.length; i++) {
      if (event.startTime >= slots[i]) {
        // Slot i is available
        slots[i] = event.endTime;
        eventPositions.push({
          ...event,
          slot: i,
        });
        placed = true;
        break;
      }
    }
    if (!placed) {
      // Need a new slot
      slots.push(event.endTime);
      eventPositions.push({
        ...event,
        slot: slots.length - 1,
      });
    }
  });

  // totalSlots is the maximum number of slots used
  let totalSlots = slots.length;

  // Update eventPositions with totalSlots
  eventPositions = eventPositions.map((event) => ({
    ...event,
    totalSlots,
  }));

  return eventPositions;
};

export const handleScroll = (selectedEventId, timelineContainerRef, dayTimelineRefs, eventsByDate) => {
  if (selectedEventId && timelineContainerRef.current) {
    let targetDate = null;

    for (const [dateStr, dayEvents] of Object.entries(eventsByDate)) {
      if (dayEvents.some((event) => event.originalId === selectedEventId || event.id === selectedEventId)) {
        targetDate = dateStr;
        break; // Exit loop once the event is found
      }
    }

    if (targetDate && dayTimelineRefs.current[targetDate]) {
      const container = timelineContainerRef.current.parentNode.parentNode.parentNode;
      const dayTimeline = dayTimelineRefs.current[targetDate];

      // Calculate the scroll offset
      const scrollOffset = dayTimeline.offsetLeft + dayTimeline.offsetWidth / 2 - container.clientWidth / 2;
      const finalScrollPosition = Math.max(scrollOffset, 0);
      // Scroll the container smoothly
      container.scrollTo({
        left: finalScrollPosition,
        behavior: "smooth",
      });
    }
  }
};

export const geocodeAddress = async (address, apiKey) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`;
    const response = await axios.get(url);
    if (response.data.status === "OK" && response.data.results.length > 0) {
      const {lat, lng} = response.data.results[0].geometry.location;
      return {lat, lng};
    } else {
      console.error("Geocoding error:", response.data.status);
      return null;
    }
  } catch (error) {
    console.error("Error during geocoding:", error);
    return null;
  }
};

export const parseDateTime = (dateString) => {
  if (!dateString) return null;
  try {
    return parse(dateString, "dd/MM/yyyy HH:mm:ss", new Date());
  } catch (error) {
    console.error("Invalid date string:", dateString);
    return null;
  }
};

export const formatInputDateTime = (date) => {
  if (!date) return "";
  const tzOffset = new Date(date).getTimezoneOffset();
  const adjustedDate = new Date(new Date(date).getTime() - tzOffset * 60 * 1000);
  return adjustedDate.toISOString().slice(0, 16);
};

export const formatDateTime = (date) => {
  return date ? new Date(date).toLocaleString() : "N/A";
};

export const getCardBackgroundColor = (type) => {
  switch (type) {
    case "Transport":
      return "#f28b82"; // Red
    case "Landmark":
      return "#81c995"; // Green
    case "Accommodation":
      return "#fbbc04"; // Yellow
    case "Food":
      return "#a5d6f8"; // Blue
    default:
      return "#e0e0e0"; // Gray
  }
};
