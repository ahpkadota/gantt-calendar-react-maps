// SidebarCard.js
import React, {useState, useEffect, useRef} from "react";
import styles from "./Sidebar.module.css";
import {formatInputDateTime, formatDateTime, getCardBackgroundColor} from "../../utils/eventUtils";

const SidebarCard = ({event, onEventSelect, isSelected, onEventUpdate}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const cardRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      // Close edit mode when clicking outside
      const handleClickOutside = (e) => {
        if (cardRef.current && !cardRef.current.contains(e.target)) {
          handleCancel();
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isEditing]);

  const handleEventDoubleClick = () => {
    setIsEditing(true);
    setFormData({...event});
  };

  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "startTime" || name === "endTime" ? new Date(value) : value,
    }));
  };

  const handleSave = () => {
    onEventUpdate({
      ...formData,
      id: event.id,
      startTime: new Date(formData.startTime),
      endTime: new Date(formData.endTime),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const renderGuestBadges = (guests) => {
    const guestList = guests.split(",").map((guest) => guest.trim());
    const displayedGuests = guestList.slice(0, 2);
    const moreGuestsCount = guestList.length > 2 ? "more" : null;

    return (
      <>
        {displayedGuests.map((guest, index) => (
          <span key={index} className={styles.guestBadge}>
            {guest.slice(0, 3)}...
          </span>
        ))}
        {moreGuestsCount && <span className={styles.guestBadge}>{moreGuestsCount}</span>}
      </>
    );
  };

  return (
    <div
      ref={cardRef}
      className={`${styles.eventCard} ${isSelected ? styles.selectedEventCard : ""}`}
      style={{backgroundColor: getCardBackgroundColor(event.type)}}
      onClick={() => onEventSelect(event.id)}
      onDoubleClick={handleEventDoubleClick}
    >
      {isEditing ? (
        <div className={styles.editableCard}>
          <input name="title" value={formData.title || ""} onChange={handleInputChange} />
          <textarea name="description" value={formData.description || ""} onChange={handleInputChange} />
          <input name="type" value={formData.type || ""} onChange={handleInputChange} />
          <input name="website" value={formData.website || ""} onChange={handleInputChange} />
          <input
            name="startTime"
            type="datetime-local"
            value={formatInputDateTime(formData.startTime)}
            onChange={handleInputChange}
          />
          <input
            name="endTime"
            type="datetime-local"
            value={formatInputDateTime(formData.endTime)}
            onChange={handleInputChange}
          />
          <input name="location" value={formData.location || ""} onChange={handleInputChange} />
          <input name="guests" value={formData.guests || ""} onChange={handleInputChange} />
          <div className={styles.buttonContainer}>
            <button onClick={handleSave}>Save</button>
            <button onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.cardHeader}>
            <span>{event.title}</span>
            <span className={`${styles.badge}`}>{event.type || "Other"}</span>
          </div>
          <p className={styles.time}>
            {formatDateTime(event.startTime)} - {formatDateTime(event.endTime)}
          </p>
          <p className={styles.description}>{event.description || "No description available."}</p>
          <div className={styles.cardFooter}>
            <div className={styles.guestsContainer}>
              {event.guests && event.guests.length !== 0 && renderGuestBadges(event.guests)}
            </div>
            <div className={styles.actionButtons}>
              {event.website && (
                <a href={event.website} target="_blank" rel="noopener noreferrer" className={styles.websiteButton}>
                  Go to Website
                </a>
              )}
              {event.location && event.location !== "Unknown" && (
                <button className={styles.locationButton}>
                  📍
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SidebarCard;
