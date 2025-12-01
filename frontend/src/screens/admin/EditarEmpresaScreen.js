import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { theme } from '../../theme';
import { api } from '../../config/api';
export default function EditarEmpresaScreen({ navigation, route }) {
  const { empresa } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    endereco: '',
    total_vagas: '',
  });

  useEffect(() => {
    if (empresa) {
      setFormData({
        nome: empresa.nome || '',
        telefone: empresa.telefone || '',
        endereco: empresa.endereco || '',
        total_vagas: empresa.total_vagas?.toString() || '20',
      });
    }
  }, [empresa]);

  async function handleSubmit() {
    if (!formData.nome) {
      setError('Por favor, preencha o nome da empresa');
      return;
    }

    if (formData.total_vagas && (isNaN(formData.total_vagas) || parseInt(formData.total_vagas) < 1)) {
      setError('A quantidade de vagas deve ser um número maior que zero');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dataToSend = {
        nome: formData.nome,
        telefone: formData.telefone,
        endereco: formData.endereco,
        total_vagas: formData.total_vagas ? parseInt(formData.total_vagas) : undefined,
      };
      
      await axios.put(
        `${api.baseURL}/api/empresas/${empresa.id}`,
        dataToSend
      );
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Erro ao atualizar empresa. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (!empresa) {
    return null;
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
              Edite os dados da empresa de estacionamento
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

            <View style={styles.readOnlyContainer}>
              <Text style={styles.readOnlyLabel}>CNPJ</Text>
              <Text style={styles.readOnlyValue}>{empresa.cnpj}</Text>
            </View>

            <View style={styles.readOnlyContainer}>
              <Text style={styles.readOnlyLabel}>Email</Text>
              <Text style={styles.readOnlyValue}>{empresa.email}</Text>
            </View>

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

            <TextInput
              label="Quantidade de Vagas *"
              value={formData.total_vagas}
              onChangeText={(text) => setFormData({ ...formData, total_vagas: text.replace(/[^0-9]/g, '') })}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              left={<TextInput.Icon icon="car-multiple" />}
              outlineColor={theme.colors.primary}
              activeOutlineColor={theme.colors.primary}
              helperText="Apenas administradores podem alterar a quantidade de vagas"
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Salvar Alterações
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
  readOnlyContainer: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.roundness / 2,
  },
  readOnlyLabel: {
    fontSize: 12,
    color: theme.colors.text,
    opacity: 0.6,
    marginBottom: 4,
    fontWeight: '500',
  },
  readOnlyValue: {
    fontSize: 16,
    color: theme.colors.text,
    opacity: 0.8,
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

