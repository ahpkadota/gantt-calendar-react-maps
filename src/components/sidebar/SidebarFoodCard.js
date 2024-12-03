import React from "react";
import styles from "./Sidebar.module.css";

const SidebarFoodCard = ({foodPlace, isSelected, onFoodSelect}) => {
  return (
    <div
      className={`${styles.foodCard} ${isSelected ? styles.selectedEventCard : ""}`}
      onClick={() => onFoodSelect(foodPlace.title)}
    >
      <h3 className={styles.foodTitle}>{foodPlace.title}</h3>
      {foodPlace.website && (
        <a href={foodPlace.website} target="_blank" rel="noopener noreferrer" className={styles.foodWebsite}>
          Visit Website
        </a>
      )}
      {foodPlace.coordinates && (
        <p className={styles.foodLocation}>
          📍 {foodPlace.coordinates[0]}, {foodPlace.coordinates[1]}
        </p>
      )}
    </div>
  );
};

export default SidebarFoodCard;
