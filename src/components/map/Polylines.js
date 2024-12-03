// Polylines.js
import React from 'react';
import { PolylineF } from '@react-google-maps/api';

const Polylines = ({ locations, options }) => {
  if (locations.length < 2) return null;
  return (
    <>
      {locations.slice(0, -1).map((start, i) => (
        <PolylineF
          key={`polyline-${i}`}
          path={[start, locations[i + 1]]}
          options={options}
        />
      ))}
    </>
  );
};

export default Polylines;
