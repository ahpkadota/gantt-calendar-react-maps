// MultiDayTimeline.js
import React, {useState, useEffect, useRef, useMemo} from "react";
import DayTimeline from "./DayTimeline";
import styles from "./MultiDayTimeline.module.css";
import {splitEventsByDay, handleScroll} from "../../utils/eventUtils";
import {parseISO} from "date-fns";
import CalendarEvent from "../../models/CalendarEvent";

const MultiDayTimeline = ({events, setEvents, config, selectedEventId, onEventSelect, onEventUpdate, onSelectDay, selectedDay, apiKey}) => {
  const [eventsByDate, setEventsByDate] = useState({});
  const timelineContainerRef = useRef(null);
  const dayTimelineRefs = useRef({}); // Changed to object for better mapping

  // Memoize grouped events to optimize performance
  const groupedEvents = useMemo(() => {
    try {
      return splitEventsByDay(events);
    } catch (error) {
      console.error("Error splitting events by day:", error);
      return {};
    }
  }, [events]);

  useEffect(() => {
    setEventsByDate(groupedEvents);
  }, [groupedEvents]);

  // Sort dates lexicographically if in 'YYYY-MM-DD' format
  const dates = useMemo(() => Object.keys(eventsByDate).sort(), [eventsByDate]);

  const handleAddEvent = (newStartTime, newEndTime) => {
    const newEvent = CalendarEvent.fromRow(
      [
        "Untitled", // title
        "", // description
        "General", // type
        "", // website
        newStartTime.toISOString(), // startTime as ISO string
        newEndTime.toISOString(), // endTime as ISO string
        "", // location
        "", //endLocation
        [], // guests
      ],
      (dateString) => parseISO(dateString), // Use parseISO as the date parser
      events.map((event) => event.id).sort((a, b)=>b-a)[0] // Use the current length of events as a fallback index
    );
    setEvents((prevEvents) => [...prevEvents, newEvent].sort((a, b) => a.startTime - b.startTime));
  };

  const handleEventMove = (id, newStartTime, newEndTime) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === id
          ? {
              ...event,
              startTime: newStartTime,
              endTime: newEndTime,
            }
          : event
      ).filter((event) => {return event.startTime < event.endTime}).sort((a, b) => a.startTime - b.startTime)
    );
  };
  // Scroll into view when selectedEventId changes
  useEffect(() => {
    handleScroll(selectedEventId, timelineContainerRef, dayTimelineRefs, eventsByDate);
  }, [selectedEventId, eventsByDate]);

  if (dates.length === 0) {
    return (
      <div className={styles.multiDayTimeline}>
        <div className={styles.noEvents}>No events to display.</div>
      </div>
    );
  }

  return (
    <div className={styles.multiDayTimeline}>
      <div className={styles.timelineWrapper}>
        {/* Left Y-Axis */}
        {config.showLabels && (
          <div className={styles.yAxis}>
            {/* Y-Axis Header */}
            <div className={styles.yAxisHeader}></div>
            <div className={styles.yAxisContent}>
              {[...Array(24)].map((_, hour) => (
                <div key={hour} className={styles.timeLabel} style={{top: `${(hour * 100) / 24}%`}}>
                  {hour}:00
                </div>
              ))}
              <div className={styles.yAxisGrid}>
                {[...Array(24)].map((_, hour) => (
                  <div key={hour} className={styles.gridLine} style={{top: `${(hour * 100) / 24}%`}}></div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Day Timelines */}
        <div className={styles.dayTimelinesContainer} ref={timelineContainerRef}>
          {dates.map((dateStr) => {
            const date = parseISO(dateStr); // Use parseISO for 'YYYY-MM-DD' format
            const dayEvents = eventsByDate[dateStr];
            return (
              <DayTimeline
                key={dateStr} // Use dateStr as a unique key
                ref={(el) => {
                  if (el) {
                    dayTimelineRefs.current[dateStr] = el;
                  }
                }}
                date={date}
                events={dayEvents}
                onEventMove={handleEventMove}
                config={config}
                selectedEventId={selectedEventId}
                onEventSelect={onEventSelect} 
                onAddEvent={handleAddEvent}
                onEventUpdate={onEventUpdate}
                onSelectDay={onSelectDay}
                isDaySelected={selectedDay && date.toLocaleDateString() === selectedDay.toLocaleDateString()}
                apiKey={apiKey}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MultiDayTimeline;
