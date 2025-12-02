import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Button, Text, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import CustomInput from '../components/CustomInput';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipo, setTipo] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const { signIn } = useAuth();

  async function handleLogin() {
    if (!email || !senha) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, senha, tipo);
      // Navigation is handled by App.js based on auth state
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
        <View style={styles.content}>
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

            <CustomInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="email"
            />

            <CustomInput
              placeholder="Senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!senhaVisivel}
              icon="lock"
              isPassword
              onRightIconPress={() => setSenhaVisivel(!senhaVisivel)}
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
        </View>
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
    color: '#6366F1', // Indigo mais brilhante para contraste
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    color: '#9CA3AF', // Cinza claro
    opacity: 0.9,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F2937', // Cinza escuro para o fundo do toggle
    borderRadius: theme.roundness - 2,
    padding: 4,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#374151',
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
    color: '#9CA3AF', // Cinza claro para texto inativo
    opacity: 1,
  },
  toggleTextActive: {
    color: '#FFFFFF',
    opacity: 1,
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