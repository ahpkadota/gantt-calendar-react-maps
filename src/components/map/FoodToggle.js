// FoodToggle.js
import React from "react";

const FoodToggle = ({showFood, showLandmark, foodToggle, landmarkToggle, handleSync}) => (
  <div
    style={{
      position: "absolute",
      top: "10px",
      right: "10px",
      zIndex: 1000,
      background: "#fff",
      padding: "5px",
    }}
  >
    <label>
      <input type="checkbox" checked={showFood} onChange={foodToggle} />
      Food
    </label>
    <label>
      <input type="checkbox" checked={showLandmark} onChange={landmarkToggle} />
      Landmarks
    </label>
    <button onClick={handleSync}>
      Sync
    </button>
  </div>
);

export default FoodToggle;
