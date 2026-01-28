import React, { useState } from "react";
import { Marker, OverlayView } from "@react-google-maps/api";
import { createSensorIcon } from "../../utils/mapUtils";
import { getFireProbabilityBubbleColors } from "../../utils/colorUtils";

/**
 * Component for rendering sensor markers on the map
 * @param {Array} sensors - Array of sensor objects to render
 * @param {string} markerDisplayMode - Display mode ('health' or 'default')
 * @param {Function} onSensorClick - Callback when sensor is clicked
 */
function SensorMarkers({ sensors, markerDisplayMode, onSensorClick }) {
  const [hoveredSensor, setHoveredSensor] = useState(null);

  return (
    <>
      {sensors.map((sensor) => (
        <React.Fragment key={sensor.id}>
          <Marker
            position={sensor.position}
            onClick={() => onSensorClick(sensor)}
            onLoad={(marker) => {
              // Add mouseover event listener
              marker.addListener("mouseover", () => {
                setHoveredSensor(sensor);
              });

              // Add mouseout event listener
              marker.addListener("mouseout", () => {
                setHoveredSensor(null);
              });
            }}
            icon={
              markerDisplayMode === "health"
                ? createSensorIcon(sensor.sensorHealth)
                : undefined
            }
          />

          {/* Fire probability bubble overlay */}
          {hoveredSensor && hoveredSensor.id === sensor.id && (() => {
            const probability = sensor.fireProbability;
            const { bubbleColor, textColor } = getFireProbabilityBubbleColors(probability);

            const bubbleStyle = {
              background: bubbleColor,
              color: textColor,
              padding: "8px 16px",
              borderRadius: "20px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              fontSize: "18px",
              fontWeight: "700",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              textAlign: "center",
              minWidth: "70px",
              whiteSpace: "nowrap",
              position: "absolute",
              transform: "translate(-50%, -120%)",
              zIndex: 100,
            };

            return (
              <OverlayView
                position={sensor.position}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                getPixelOffset={() => ({ x: 0, y: 0 })}
              >
                <div style={bubbleStyle}>{probability}%</div>
              </OverlayView>
            );
          })()}
        </React.Fragment>
      ))}
    </>
  );
}

export default SensorMarkers;
