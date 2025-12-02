import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import AdminDashboard from './src/screens/admin/Dashboard';
import CadastrarEmpresaScreen from './src/screens/admin/CadastrarEmpresaScreen';
import EditarEmpresaScreen from './src/screens/admin/EditarEmpresaScreen';
import EmpresaDashboard from './src/screens/empresa/Dashboard';
import ConfigValoresScreen from './src/screens/empresa/ConfigValoresScreen';
import SelecionarTempoScreen from './src/screens/empresa/SelecionarTempoScreen';
import ScannerEntradaScreen from './src/screens/empresa/ScannerEntradaScreen';
import ConfirmarVeiculoScreen from './src/screens/empresa/ConfirmarVeiculoScreen';
import CronometroScreen from './src/screens/empresa/CronometroScreen';
import PagamentoScreen from './src/screens/empresa/PagamentoScreen';
import SelecionarMetodoPagamentoScreen from './src/screens/empresa/SelecionarMetodoPagamentoScreen';
import { theme } from './src/theme';

const Stack = createStackNavigator();

function LogoutButton({ navigation }) {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleLogout}
      style={{ marginRight: 16, padding: 8 }}
      activeOpacity={0.7}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Sair</Text>
    </TouchableOpacity>
  );
}

function AppNavigator() {
  const { signed, user, loading } = useAuth();
  const navigationRef = useRef(null);
  const routeNameRef = useRef();

  useEffect(() => {
    if (!loading && navigationRef.current) {
      const currentRoute = routeNameRef.current;
      if (!signed && currentRoute !== 'Login') {
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } else if (signed && currentRoute === 'Login') {
        const dashboardName = user?.tipo === 'admin' ? 'AdminDashboard' : 'EmpresaDashboard';
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: dashboardName }],
        });
      }
    }
  }, [signed, user, loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const getInitialRoute = () => {
    if (!signed) {
      return 'Login';
    }
    return user?.tipo === 'admin' ? 'AdminDashboard' : 'EmpresaDashboard';
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
      }}
      onStateChange={() => {
        const previousRouteName = routeNameRef.current;
        const currentRoute = navigationRef.current?.getCurrentRoute()?.name;
        routeNameRef.current = currentRoute;
      }}
    >
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
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
          options={({ navigation }) => ({
            title: 'Painel Administrativo',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerRight: () => <LogoutButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="CadastrarEmpresa"
          component={CadastrarEmpresaScreen}
          options={{
            title: 'Cadastrar Empresa',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
          }}
        />
        <Stack.Screen
          name="EditarEmpresa"
          component={EditarEmpresaScreen}
          options={{
            title: 'Editar Empresa',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
          }}
        />
        <Stack.Screen
          name="EmpresaDashboard"
          component={EmpresaDashboard}
          options={({ navigation }) => ({
            title: 'Painel da Empresa',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerRight: () => <LogoutButton navigation={navigation} />,
          })}
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
        <Stack.Screen
          name="SelecionarTempo"
          component={SelecionarTempoScreen}
          options={{
            title: 'Selecionar Tempo',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
          }}
        />
        <Stack.Screen
          name="ConfirmarVeiculo"
          component={ConfirmarVeiculoScreen}
          options={{
            title: 'Confirmar Entrada',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
          }}
        />
        <Stack.Screen
          name="Cronometro"
          component={CronometroScreen}
          options={{
            title: 'Cronômetro',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
          }}
        />
        <Stack.Screen
          name="Pagamento"
          component={PagamentoScreen}
          options={{
            title: 'Pagamento',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
          }}
        />
        <Stack.Screen
          name="ScannerEntrada"
          component={ScannerEntradaScreen}
          options={{
            title: 'Escanear Placa',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SelecionarMetodoPagamento"
          component={SelecionarMetodoPagamentoScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <StatusBar style="light" />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
}); 