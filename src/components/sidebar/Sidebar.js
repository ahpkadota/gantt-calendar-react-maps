import React, {useEffect, useRef, useState} from "react";
import styles from "./Sidebar.module.css";
import SidebarCard from "./SidebarCard";
import SidebarFoodCard from "./SidebarFoodCard";

const Sidebar = ({events, foodPlaces,landmarkPlaces, onEventSelect, selectedEventId, onEventUpdate, onFoodSelect, selectedFoodId, onLandmarkSelect, selectedLandmarkId}) => {
  const eventRefs = useRef({});
  const [activeTab, setActiveTab] = useState("Events");

  useEffect(() => {
    if (selectedEventId && eventRefs.current[selectedEventId]) {
      eventRefs.current[selectedEventId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedEventId]);

  return (
    <div className={styles.sidebar}>
      {/* Tab Bar */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === "Events" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("Events")}
        >
          Events
        </button>
        <button
          className={`${styles.tab} ${activeTab === "Food" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("Food")}
        >
          Food
        </button>
        <button
          className={`${styles.tab} ${activeTab === "Landmarks" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("Landmarks")}
        >
          Landmarks
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === "Events" && (
          <div className={styles.eventList}>
            {events.map((event) => (
              <div key={event.id} ref={(el) => (eventRefs.current[event.id] = el)}>
                <SidebarCard
                  event={event}
                  onEventSelect={onEventSelect}
                  isSelected={selectedEventId === event.id}
                  onEventUpdate={onEventUpdate}
                />
              </div>
            ))}
          </div>
        )}
        {activeTab === "Food" && (
          <div className={styles.foodList}>
            {foodPlaces.map((place, index) => (
              <SidebarFoodCard
                key={index}
                foodPlace={place}
                isSelected={selectedFoodId === place.title}
                onFoodSelect={onFoodSelect}
              />
            ))}
          </div>
        )}
        {activeTab === "Landmarks" && (
          <div className={styles.foodList}>
            {landmarkPlaces.map((place, index) => (
              <SidebarFoodCard
                key={index}
                foodPlace={place}
                isSelected={selectedLandmarkId === place.title}
                onFoodSelect={onLandmarkSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
