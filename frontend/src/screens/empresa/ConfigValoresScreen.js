import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button, Card, Title, TextInput, Text, IconButton, List } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { theme } from '../../theme';
import { api } from '../../config/api';

export default function ConfigValoresScreen({ navigation }) {
  const [configValores, setConfigValores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [novaConfig, setNovaConfig] = useState({
    tipo_veiculo: 'carro',
    valor_hora: '',
    valor_fracao: ''
  });
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      setError('');
      const response = await axios.get(`${api.baseURL}/api/config_valores`);
      setConfigValores(response.data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setError('Erro ao carregar configurações. Tente novamente.');
    }
  }

  async function handleCreateConfig() {
    if (!novaConfig.valor_hora || !novaConfig.valor_fracao) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await axios.post(`${api.baseURL}/api/config_valores`, {
        tipo_veiculo: novaConfig.tipo_veiculo,
        valor_hora: parseFloat(novaConfig.valor_hora) || 0,
        valor_fracao: parseFloat(novaConfig.valor_fracao) || 0
      });
      setNovaConfig({
        tipo_veiculo: 'carro',
        valor_hora: '',
        valor_fracao: ''
      });
      loadConfig();
    } catch (error) {
      console.error('Erro ao criar configuração:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Erro ao criar configuração. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateConfig(config) {
    try {
      setError('');
      setLoading(true);
      await axios.put(`${api.baseURL}/api/config_valores/${config.id}`, {
        valor_hora: config.valor_hora,
        valor_fracao: config.valor_fracao,
      });
      loadConfig();
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Erro ao atualizar configuração. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  const tipoVeiculoLabel = (tipo) => {
    const labels = {
      'carro': 'Carro',
      'moto': 'Moto',
      'caminhao': 'Caminhão'
    };
    return labels[tipo] || tipo;
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Adicionar Nova Configuração</Title>
              
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <List.Item
                title="Tipo de Veículo"
                description={tipoVeiculoLabel(novaConfig.tipo_veiculo)}
                right={props => <List.Icon {...props} icon="chevron-down" />}
                onPress={() => setShowPicker(true)}
                style={styles.pickerButton}
              />

              <View style={styles.pickerModal}>
                {showPicker && (
                  <View style={styles.pickerOptions}>
                    <TouchableOpacity
                      style={styles.pickerOption}
                      onPress={() => {
                        setNovaConfig({ ...novaConfig, tipo_veiculo: 'carro' });
                        setShowPicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionText}>Carro</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pickerOption}
                      onPress={() => {
                        setNovaConfig({ ...novaConfig, tipo_veiculo: 'moto' });
                        setShowPicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionText}>Moto</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pickerOption}
                      onPress={() => {
                        setNovaConfig({ ...novaConfig, tipo_veiculo: 'caminhao' });
                        setShowPicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionText}>Caminhão</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <TextInput
                label="Valor por Hora (R$)"
                value={novaConfig.valor_hora}
                onChangeText={text => setNovaConfig({ ...novaConfig, valor_hora: text })}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
                left={<TextInput.Icon icon="currency-usd" />}
              />
              
              <TextInput
                label="Valor por Fração (15min) (R$)"
                value={novaConfig.valor_fracao}
                onChangeText={text => setNovaConfig({ ...novaConfig, valor_fracao: text })}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
                left={<TextInput.Icon icon="clock-outline" />}
              />
              
              <Button
                mode="contained"
                onPress={handleCreateConfig}
                loading={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                Adicionar Configuração
              </Button>
            </Card.Content>
          </Card>

          {configValores.length > 0 && (
            <View style={styles.existingSection}>
              <Title style={styles.sectionTitle}>Configurações Existentes</Title>
              {configValores.map((config) => (
                <Card key={config.id} style={styles.configCard}>
                  <Card.Content>
                    <Title style={styles.configTitle}>
                      {tipoVeiculoLabel(config.tipo_veiculo)}
                    </Title>
                    
                    <TextInput
                      label="Valor por Hora (R$)"
                      value={config.valor_hora.toString()}
                      onChangeText={(text) => {
                        const newConfigs = [...configValores];
                        const index = newConfigs.findIndex(c => c.id === config.id);
                        newConfigs[index].valor_hora = parseFloat(text) || 0;
                        setConfigValores(newConfigs);
                      }}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.input}
                      left={<TextInput.Icon icon="currency-usd" />}
                    />
                    
                    <TextInput
                      label="Valor por Fração (15min) (R$)"
                      value={config.valor_fracao.toString()}
                      onChangeText={(text) => {
                        const newConfigs = [...configValores];
                        const index = newConfigs.findIndex(c => c.id === config.id);
                        newConfigs[index].valor_fracao = parseFloat(text) || 0;
                        setConfigValores(newConfigs);
                      }}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.input}
                      left={<TextInput.Icon icon="clock-outline" />}
                    />
                    
                    <Button
                      mode="contained"
                      onPress={() => handleUpdateConfig(config)}
                      loading={loading}
                      style={styles.button}
                      contentStyle={styles.buttonContent}
                    >
                      Atualizar
                    </Button>
                  </Card.Content>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    ...theme.shadows.medium,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  pickerButton: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.roundness - 2,
    marginBottom: theme.spacing.md,
  },
  pickerModal: {
    position: 'relative',
  },
  pickerOptions: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness - 2,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
    overflow: 'hidden',
  },
  pickerOption: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backgroundSecondary,
  },
  pickerOptionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  input: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  button: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.roundness - 2,
    ...theme.shadows.small,
  },
  buttonContent: {
    paddingVertical: theme.spacing.sm,
  },
  existingSection: {
    marginTop: theme.spacing.lg,
  },
  configCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    ...theme.shadows.medium,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
    textTransform: 'capitalize',
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
});

