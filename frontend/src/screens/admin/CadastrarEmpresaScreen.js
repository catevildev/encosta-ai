import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { theme } from '../../theme';
import { api } from '../../config/api';
import CustomInput from '../../components/CustomInput';

export default function CadastrarEmpresaScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

            <CustomInput
              placeholder="Nome *"
              value={formData.nome}
              onChangeText={(text) => setFormData({ ...formData, nome: text })}
              icon="office-building"
            />

            <CustomInput
              placeholder="CNPJ *"
              value={formData.cnpj}
              onChangeText={(text) => setFormData({ ...formData, cnpj: text })}
              keyboardType="numeric"
              icon="card-account-details"
            />

            <CustomInput
              placeholder="Email *"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="email"
            />

            <CustomInput
              placeholder="Senha *"
              value={formData.senha}
              onChangeText={(text) => setFormData({ ...formData, senha: text })}
              secureTextEntry
              icon="lock"
              isPassword
            />

            <CustomInput
              placeholder="Telefone"
              value={formData.telefone}
              onChangeText={(text) => setFormData({ ...formData, telefone: text })}
              keyboardType="phone-pad"
              icon="phone"
            />

            <CustomInput
              placeholder="Endereço"
              value={formData.endereco}
              onChangeText={(text) => setFormData({ ...formData, endereco: text })}
              multiline
              numberOfLines={3}
              icon="map-marker"
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

