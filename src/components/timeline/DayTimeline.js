import React, {useRef, useLayoutEffect, useState, useCallback} from "react";
import {useDrop} from "react-dnd";
import EventItem from "./EventItem";
import styles from "./DayTimeline.module.css";
import {computeEventPositions} from "../../utils/eventUtils";

const DayTimeline = React.forwardRef(
  (
    {
      date,
      events,
      onEventMove,
      config,
      selectedEventId,
      onEventSelect,
      onAddEvent,
      onEventUpdate,
      onSelectDay,
      isDaySelected,
      apiKey
    },
    ref
  ) => {
    const containerRef = useRef(null);
    const [containerHeight, setContainerHeight] = useState(0);

    useLayoutEffect(() => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    }, []);

    const handleEventResize = (id, newStartTime, newEndTime) => {
      onEventMove(id, newStartTime, newEndTime);
    };
    const handleTimeSlotClick = (e) => {
      // Prevent the click from triggering when clicking on an existing event
      if (e.target !== containerRef.current.lastChild) return;

      const rect = containerRef.current.lastChild.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const clickRatio = clickY / rect.height;
      const totalMinutes = 24 * 60;
      let clickMinutes = clickRatio * totalMinutes;

      // Round to the nearest 15 minutes
      clickMinutes = Math.round(clickMinutes / 15) * 15;

      // Create the new start and end times
      const newStartTime = new Date(date);
      newStartTime.setHours(0, 0, 0, 0);
      newStartTime.setMinutes(clickMinutes);

      const newEndTime = new Date(newStartTime.getTime() + 60 * 60 * 1000); // +1 hour
      // Call a function passed via props to add the new event
      onAddEvent(newStartTime, newEndTime);
    };

    const [, dropRef] = useDrop({
      accept: "EVENT",
      drop: (item, monitor) => {
        const delta = monitor.getDifferenceFromInitialOffset();
        const containerHeight = containerRef.current.clientHeight;
        const minutesMoved = (delta.y / containerHeight) * 1440;

        // Calculate new start and end times
        const originalDuration = item.endTime - item.startTime;

        // Adjust the start time
        const newStartTime = new Date(date); // Use the date of the current timeline
        newStartTime.setHours(item.startTime.getHours(), item.startTime.getMinutes(), 0, 0);
        newStartTime.setMinutes(Math.round((newStartTime.getMinutes() + minutesMoved) / 15) * 15);

        // Adjust the end time based on the original duration
        const newEndTime = new Date(newStartTime.getTime() + originalDuration);

        // Update the original event
        onEventMove(item.originalId, newStartTime, newEndTime);
      },
    });
    // Combine dropRef and forwarded ref
    const combinedRef = useCallback(
      (node) => {
        dropRef(node); // Attach drop target
        containerRef.current = node; // Assign node to containerRef
        if (ref) {
          if (typeof ref === "function") {
            ref(node);
          } else {
            ref.current = node;
          }
        }
      },
      [dropRef, ref]
    );

    // Process events to compute positions
    const eventsWithPositions = computeEventPositions(events);
    return (
      <div className={`${styles.dayTimeline} ${isDaySelected ? styles.isSelected : ""}`} ref={combinedRef}>
        <div
          className={styles.dayTimelineHeader}
          onClick={() => {
            onSelectDay(isDaySelected ? null : date);
            onEventSelect(null);
          }}
        >
          {date.toDateString()}
        </div>
        <div className={styles.dayTimelineContent} ref={containerRef} onDoubleClick={handleTimeSlotClick}>
          {/* Grid Lines */}
          {[...Array(25)].map((_, hour) => (
            <div key={hour} className={styles.gridLine} style={{top: `${(hour * 100) / 24}%`}}></div>
          ))}
          {/* Events */}
          {eventsWithPositions.map((event) => (
            <EventItem
              key={`${event.id}-${event.startTime}`}
              event={event}
              containerHeight={containerHeight}
              config={config}
              onEventResize={handleEventResize}
              slot={event.slot}
              totalSlots={event.totalSlots}
              isSelected={selectedEventId === event.originalId}
              onEventSelect={onEventSelect}
              onEventUpdate={onEventUpdate}
              onSelectDay={onSelectDay}
              apiKey={apiKey}
            />
          ))}
        </div>
      </div>
    );
  }
);

export default DayTimeline;
