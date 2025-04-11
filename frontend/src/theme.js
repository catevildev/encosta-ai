import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2196F3',
    accent: '#03A9F4',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#212121',
    error: '#B00020',
    success: '#4CAF50',
    warning: '#FFC107',
    info: '#2196F3',
  },
  roundness: 10,
  animation: {
    scale: 1.0,
  },
}; 