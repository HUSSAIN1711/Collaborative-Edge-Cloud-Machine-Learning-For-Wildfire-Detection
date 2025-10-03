// src/store/useAppStore.js
import { create } from 'zustand';
import sensorsData from '../data/sensors.json';
import dronePathData from '../data/dronePath.json';

const useAppStore = create((set) => ({
  sensors: sensorsData,
  dronePath: dronePathData,
  selectedSensor: null,
  dronePosition: dronePathData[0],
  setSelectedSensor: (sensor) => set({ selectedSensor: sensor }),
  setDronePosition: (position) => set({ dronePosition: position }),
}));

export default useAppStore;
