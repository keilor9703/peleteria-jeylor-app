import { createTheme } from '@mui/material/styles';

const getAppTheme = (mode) => createTheme({
  palette: {
    mode, // 'light' or 'dark'
    primary: {
      main: '#1976D2', // Vibrant Blue
    },
    secondary: {
      main: '#FFC107', // Warm Amber/Yellow
    },
    background: {
      default: mode === 'light' ? '#FFFFFF' : '#121212', // White for light, dark gray for dark
      paper: mode === 'light' ? '#EEEEEE' : '#1E1E1E', // Light gray for light, darker gray for dark
    },
    text: {
      primary: mode === 'light' ? '#424242' : '#FFFFFF', // Dark gray for light, white for dark
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
});

export default getAppTheme;
