import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Title, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { theme } from '../../theme';
import { api } from '../../config/api';

export default function CadastrarEmpresaScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    senha: '',
    telefone: '',
    endereco: '',
  });

  async function handleSubmit() {
    if (!formData.nome || !formData.cnpj || !formData.email || !formData.senha) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${api.baseURL}/api/empresas`, formData);
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao cadastrar empresa:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Erro ao cadastrar empresa. Tente novamente.');
      }
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Surface style={styles.surface}>
            <Text style={styles.subtitle}>
              Preencha os dados da empresa de estacionamento
            </Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TextInput
              label="Nome *"
              value={formData.nome}
              onChangeText={(text) => setFormData({ ...formData, nome: text })}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="office-building" />}
              outlineColor={theme.colors.primary}
              activeOutlineColor={theme.colors.primary}
            />

            <TextInput
              label="CNPJ *"
              value={formData.cnpj}
              onChangeText={(text) => setFormData({ ...formData, cnpj: text })}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              left={<TextInput.Icon icon="card-account-details" />}
              outlineColor={theme.colors.primary}
              activeOutlineColor={theme.colors.primary}
            />

            <TextInput
              label="Email *"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email" />}
              outlineColor={theme.colors.primary}
              activeOutlineColor={theme.colors.primary}
            />

            <TextInput
              label="Senha *"
              value={formData.senha}
              onChangeText={(text) => setFormData({ ...formData, senha: text })}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!senhaVisivel}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={senhaVisivel ? "eye-off" : "eye"}
                  onPress={() => setSenhaVisivel(!senhaVisivel)}
                />
              }
              outlineColor={theme.colors.primary}
              activeOutlineColor={theme.colors.primary}
            />

            <TextInput
              label="Telefone"
              value={formData.telefone}
              onChangeText={(text) => setFormData({ ...formData, telefone: text })}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" />}
              outlineColor={theme.colors.primary}
              activeOutlineColor={theme.colors.primary}
            />

            <TextInput
              label="Endereço"
              value={formData.endereco}
              onChangeText={(text) => setFormData({ ...formData, endereco: text })}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="map-marker" />}
              outlineColor={theme.colors.primary}
              activeOutlineColor={theme.colors.primary}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Cadastrar Empresa
            </Button>

            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
              contentStyle={styles.buttonContent}
            >
              Cancelar
            </Button>
          </Surface>
        </ScrollView>
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
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  surface: {
    padding: theme.spacing.lg,
    borderRadius: theme.roundness - 2,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.large,
  },
  title: {
    fontSize: 28,
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
  errorContainer: {
    backgroundColor: theme.colors.error + '15',
    padding: theme.spacing.sm,
    borderRadius: theme.roundness / 2,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
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
  cancelButton: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.roundness - 2,
  },
});

