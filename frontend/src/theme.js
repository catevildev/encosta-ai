import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6366F1', // Indigo moderno
    accent: '#8B5CF6', // Roxo moderno
    background: '#121212',
    surface: '#2B2B2B',
    text: '#F5F5F5',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    // Cores adicionais para gradientes
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    accentLight: '#A78BFA',
    accentDark: '#7C3AED',
    // Cores de fundo
    backgroundSecondary: '#F3F4F6',
    surfaceVariant: '#F9FAFB',
  },
  roundness: 12,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  animation: {
    scale: 1.0,
    duration: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
  },
}; 