// EventEditPopup.js
import React, {useState, useEffect, useRef} from "react";
import styles from "./EventEditPopup.module.css";
import {formatInputDateTime, geocodeAddress} from "../../utils/eventUtils";

const EventEditPopup = ({event, onClose, onSave, apiKey}) => {
  const [formData, setFormData] = useState({...event});
  const [isDirty, setIsDirty] = useState(false);
  const popupRef = useRef(null);

  // Close the popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleChange = (e) => {
    setIsDirty(true);
    const {name, value} = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSaveClick = async () => {
    let coord = await geocodeAddress(formData.address, apiKey);
    let endCoord = formData.endAddress ? await geocodeAddress(formData.endAddress, apiKey) : "";
    onSave({
      ...formData,
      id: event.id,
      startTime: new Date(formData.startTime),
      endTime: new Date(formData.endTime),
      location: formData.address ? coord.lat + ", " + coord.lng : "",
      endLocation: formData.endAddress ? endCoord.lat + ", " + endCoord.lng : "",
    });
  };

  const handleCancelClick = () => {
    onClose();
  };

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popupContent} ref={popupRef}>
        <form>
          <label>
            Title:
            <input name="title" value={formData.title || ""} onChange={handleChange} />
          </label>
          <label>
            Description:
            <textarea name="description" value={formData.description || ""} onChange={handleChange} />
          </label>
          <label>
            Type:
            <input name="type" value={formData.type || ""} onChange={handleChange} />
          </label>
          <label>
            Website:
            <input name="website" value={formData.website || ""} onChange={handleChange} />
          </label>
          <label>
            Start Time:
            <input
              name="startTime"
              type="datetime-local"
              value={formatInputDateTime(formData.startTime)}
              onChange={handleChange}
            />
          </label>
          <label>
            End Time:
            <input
              name="endTime"
              type="datetime-local"
              value={formatInputDateTime(formData.endTime)}
              onChange={handleChange}
            />
          </label>
          <label>
            Location:
            <input name="address" value={formData.address || ""} onChange={handleChange} />
          </label>
          <label>
            (Optional) End Location:
            <input name="endAddress" value={formData.endAddress || ""} onChange={handleChange} />
          </label>
          <label>
            Guests:
            <input name="guests" value={formData.guests || ""} onChange={handleChange} />
          </label>
        </form>
        {isDirty && (
          <div className={styles.buttonContainer}>
            <button onClick={handleSaveClick}>Save</button>
            <button onClick={handleCancelClick}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventEditPopup;
