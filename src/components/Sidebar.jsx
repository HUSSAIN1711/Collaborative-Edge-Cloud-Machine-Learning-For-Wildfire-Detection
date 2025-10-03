import React from 'react';
import { Box, Typography, Card, CardContent, CardMedia } from '@mui/material';
import useAppStore from '../store/useAppStore';

function Sidebar() {
  const selectedSensor = useAppStore((state) => state.selectedSensor);
  const dronePosition = useAppStore((state) => state.dronePosition);

  return (
    <Box>
      {selectedSensor ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Sensor #{selectedSensor.id}</Typography>
            <Typography variant="body2">Status: {selectedSensor.status}</Typography>
            <Typography variant="body2">Last Ping: {selectedSensor.lastPing}</Typography>
            <Typography variant="body2">Temperature: {selectedSensor.temperature}°F</Typography>
            <Typography variant="body2">Humidity: {selectedSensor.humidity}%</Typography>
            <Typography variant="body2">Location: {selectedSensor.position.lat.toFixed(4)}, {selectedSensor.position.lng.toFixed(4)}</Typography>
            <Typography variant="body2" sx={{ color: selectedSensor.firePercentage > 50 ? 'red' : 'inherit' }}>
              Fire Percentage: {selectedSensor.firePercentage}%
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6">No Sensor Selected</Typography>
            <Typography variant="body2">Click a sensor on the map to see its details.</Typography>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6">Drone Live Feed</Typography>
          <Typography variant="body2">
            Location: {dronePosition.lat.toFixed(4)}, {dronePosition.lng.toFixed(4)}
          </Typography>
        </CardContent>
        {selectedSensor && (
          <CardMedia
            component="img"
            height="194"
            image={selectedSensor.imageUrl}
            alt={`Live feed from sensor ${selectedSensor.id}`}
          />
        )}
      </Card>
    </Box>
  );
}

export default Sidebar;
