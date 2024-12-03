// EventItem.js
import React, {useState, useRef, useEffect, useCallback, useMemo} from "react";
import {useDrag} from "react-dnd";
import styles from "./EventItem.module.css";
import {handleMouseMoveUtil, handleMouseUpUtil, formatTimeRange} from "../../utils/eventUtils";
import EventEditPopup from "./EventEditPopup";

const EventItem = ({
  event,
  config,
  onEventResize,
  slot,
  isSelected,
  onEventSelect,
  onEventUpdate,
  onSelectDay,
  apiKey,
}) => {
  const [tempStartTime, setTempStartTime] = useState(event.startTime);
  const [tempEndTime, setTempEndTime] = useState(event.endTime);
  const [isEditing, setIsEditing] = useState(false);
  const [resizing, setResizing] = useState(null);
  const [{isDragging}, dragRef] = useDrag({
    type: "EVENT",
    item: {...event, originalId: event.originalId || event.id},
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const eventRef = useRef(null);

  const combinedRef = useCallback(
    (node) => {
      eventRef.current = node;
      dragRef(node);
    },
    [dragRef]
  );

  const handleEventClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (!isSelected) {
        onEventSelect(event.originalId || event.id);
        onSelectDay(new Date(event.startTime));
      } else {
        onEventSelect(null);
      }
    },
    [event, onEventSelect, isSelected, onSelectDay]
  );
  const handleEventDoubleClick = useCallback((e) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);
  const handleCloseEdit = () => {
    setIsEditing(false);
  };
  // Function to save the updated event
  const handleSave = (updatedEvent) => {
    onEventUpdate(updatedEvent);
    setIsEditing(false);
  };

  // Derived styles
  const stylesProps = useMemo(() => {
    const startMinutes = tempStartTime.getHours() * 60 + tempStartTime.getMinutes();
    const endMinutes = tempEndTime.getHours() * 60 + tempEndTime.getMinutes();
    const duration = endMinutes - startMinutes;

    return {
      top: `${(startMinutes / 1440) * 100}%`,
      height: `${(duration / 1440) * 100}%`,
      left: `${slot * 10}%`,
      width: `${100 - slot * 10}%`,
      zIndex: slot,
      opacity: isDragging ? 0.5 : 1,
      fontSize: config.fontSize,
    };
  }, [tempStartTime, tempEndTime, slot, isDragging, config.fontSize]);

  const handleMouseDown = useCallback((e, handle) => {
    e.stopPropagation();
    e.preventDefault();
    setResizing(handle);
  }, []);

  // Add/remove listeners
  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e) =>
      handleMouseMoveUtil({
        e,
        resizing,
        eventRef,
        tempStartTime,
        tempEndTime,
        setTempStartTime,
        setTempEndTime,
      });

    const handleMouseUp = () =>
      handleMouseUpUtil({
        resizing,
        tempStartTime,
        tempEndTime,
        event,
        onEventResize,
        setResizing,
      });

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, tempStartTime, tempEndTime, onEventResize, event]);

  return (
    <>
      {isEditing && <EventEditPopup event={event} onClose={handleCloseEdit} onSave={handleSave} apiKey={apiKey} />}
      <div
        ref={combinedRef}
        className={`${styles.eventItem} ${isSelected ? styles.selectedEvent : ""}`}
        style={{
          ...stylesProps,
          position: "absolute",
        }}
      >
        {event.isFirstDay && (
          <div
            className={`${styles.resizeHandle} ${styles.resizeHandleTop}`}
            onMouseDown={(e) => handleMouseDown(e, "top")}
          />
        )}
        <div className={styles.eventContent} onClick={handleEventClick} onDoubleClick={handleEventDoubleClick}>
          <span>{formatTimeRange(tempStartTime, tempEndTime, event.title)}</span>
          {event.description && <span>{event.description}</span>}
        </div>
        {event.isLastDay && (
          <div
            className={`${styles.resizeHandle} ${styles.resizeHandleBottom}`}
            onMouseDown={(e) => handleMouseDown(e, "bottom")}
          />
        )}
      </div>
    </>
  );
};

export default EventItem;
