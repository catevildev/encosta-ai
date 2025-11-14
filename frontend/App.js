import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import AdminDashboard from './src/screens/admin/Dashboard';
import EmpresaDashboard from './src/screens/empresa/Dashboard';
import ConfigValoresScreen from './src/screens/empresa/ConfigValoresScreen';
import { theme } from './src/theme';

const Stack = createStackNavigator();

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <StatusBar style="light" />
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: theme.colors.primary,
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 0,
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: '700',
                fontSize: 18,
                letterSpacing: 0.5,
              },
              headerBackTitleVisible: false,
              ...TransitionPresets.SlideFromRightIOS,
              cardStyleInterpolator: ({ current, layouts }) => {
                return {
                  cardStyle: {
                    transform: [
                      {
                        translateX: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [layouts.screen.width, 0],
                        }),
                      },
                    ],
                  },
                };
              },
              transitionSpec: {
                open: {
                  animation: 'spring',
                  config: {
                    stiffness: 1000,
                    damping: 500,
                    mass: 3,
                    overshootClamping: true,
                    restDisplacementThreshold: 0.01,
                    restSpeedThreshold: 0.01,
                  },
                },
                close: {
                  animation: 'spring',
                  config: {
                    stiffness: 1000,
                    damping: 500,
                    mass: 3,
                    overshootClamping: true,
                    restDisplacementThreshold: 0.01,
                    restSpeedThreshold: 0.01,
                  },
                },
              },
            }}
          >
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="AdminDashboard" 
              component={AdminDashboard}
              options={{ 
                title: 'Painel Administrativo',
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
              }}
            />
            <Stack.Screen 
              name="EmpresaDashboard" 
              component={EmpresaDashboard}
              options={{ 
                title: 'Painel da Empresa',
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
              }}
            />
            <Stack.Screen 
              name="ConfigValores" 
              component={ConfigValoresScreen}
              options={{ 
                title: 'Configurar Valores',
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
} 