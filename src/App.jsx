import React from 'react';
import { Box, Grid, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import MapContainer from './components/MapContainer';
import Sidebar from './components/Sidebar';

// Create a dark theme to match the screenshot
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#2c3e50',
      paper: '#34495e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <Grid container>
          <Grid item xs={12} md={8}>
            <MapContainer />
          </Grid>
          <Grid item xs={12} md={4} sx={{ p: 2 }}>
            <Sidebar />
          </Grid>
        </Grid>
      </Box>
    </ThemeProvider>
  );
}

export default App;
