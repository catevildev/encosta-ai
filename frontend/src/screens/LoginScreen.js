import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Animated, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipo, setTipo] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  async function handleLogin() {
    if (!email || !senha) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await signIn(email, senha, tipo);
      navigation.replace(tipo === 'admin' ? 'AdminDashboard' : 'EmpresaDashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.accent]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <Surface style={styles.surface}>
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>
            
            <Text style={styles.title}>EstacionaAI</Text>
            <Text style={styles.subtitle}>Sistema de Gestão de Estacionamento</Text>
            
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                onPress={() => setTipo('admin')}
                style={[
                  styles.toggleButton,
                  tipo === 'admin' && styles.toggleButtonActive,
                ]}
              >
                <Text style={[
                  styles.toggleText,
                  tipo === 'admin' && styles.toggleTextActive,
                ]}>
                  Admin
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTipo('empresa')}
                style={[
                  styles.toggleButton,
                  tipo === 'empresa' && styles.toggleButtonActive,
                ]}
              >
                <Text style={[
                  styles.toggleText,
                  tipo === 'empresa' && styles.toggleTextActive,
                ]}>
                  Empresa
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email" />}
              outlineColor={theme.colors.primary}
              activeOutlineColor={theme.colors.primary}
            />

            <TextInput
              label="Senha"
              value={senha}
              onChangeText={setSenha}
              mode="outlined"
              style={styles.input}
              secureTextEntry
              left={<TextInput.Icon icon="lock" />}
              outlineColor={theme.colors.primary}
              activeOutlineColor={theme.colors.primary}
            />

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Entrar
            </Button>
          </Surface>
        </Animated.View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  content: {
    width: '100%',
  },
  surface: {
    padding: theme.spacing.lg,
    borderRadius: theme.roundness - 2,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.large,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    color: theme.colors.text,
    opacity: 0.7,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.roundness - 2,
    padding: 4,
    marginBottom: theme.spacing.md,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.roundness - 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.small,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    opacity: 0.7,
  },
  toggleTextActive: {
    color: '#FFFFFF',
    opacity: 1,
  },
  input: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  button: {
    marginTop: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    paddingVertical: 4,
    ...theme.shadows.medium,
  },
  buttonContent: {
    paddingVertical: theme.spacing.sm,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  errorContainer: {
    backgroundColor: theme.colors.error + '15',
    padding: theme.spacing.sm,
    borderRadius: theme.roundness / 2,
    marginBottom: theme.spacing.sm,
  },
  error: {
    color: theme.colors.error,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
}); 