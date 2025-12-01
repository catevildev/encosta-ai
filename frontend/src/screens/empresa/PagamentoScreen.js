import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Title, Button, Card, TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import axios from 'axios';
import { api } from '../../config/api';

export default function PagamentoScreen({ navigation, route }) {
  const { vaga } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [valorCalculado, setValorCalculado] = useState(null);
  const [pagamentoData, setPagamentoData] = useState({
    tipo_pagamento: 'dinheiro',
    numero_documento: '',
    valor_cobrado: '',
  });

  useEffect(() => {
    calcularValor();
  }, []);

  async function calcularValor() {
    try {
      const response = await axios.get(`${api.baseURL}/api/vagas/${vaga.id}/calcular-valor`);
      setValorCalculado(response.data);
      setPagamentoData(prev => ({
        ...prev,
        valor_cobrado: response.data.valorTotal.toFixed(2),
      }));
    } catch (error) {
      console.error('Erro ao calcular valor:', error);
      Alert.alert('Erro', 'Erro ao calcular valor');
    }
  }

  async function handleFinalizarPagamento() {
    if (!pagamentoData.numero_documento || !pagamentoData.valor_cobrado) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${api.baseURL}/api/vagas/${vaga.id}/finalizar-saida`, {
        tipo_pagamento: pagamentoData.tipo_pagamento,
        numero_documento: pagamentoData.numero_documento,
        valor_cobrado: parseFloat(pagamentoData.valor_cobrado),
      });

      Alert.alert('Sucesso', 'Saída finalizada com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'EmpresaDashboard' }],
            });
          },
        },
      ]);
    } catch (error) {
      console.error('Erro ao finalizar pagamento:', error);
      if (error.response?.data?.message) {
        Alert.alert('Erro', error.response.data.message);
      } else {
        Alert.alert('Erro', 'Erro ao finalizar pagamento. Verifique se o valor está correto.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (!vaga || !valorCalculado) {
    return null;
  }

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.accent]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.surface}>
          <Title style={styles.title}>Pagamento</Title>

          <Card style={styles.infoCard}>
            <Card.Content>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Placa:</Text>
                <Text style={styles.infoValue}>{vaga.placa}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tempo:</Text>
                <Text style={styles.infoValue}>
                  {valorCalculado.horas}h {valorCalculado.minutos}m
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, styles.valorLabel]}>Valor Total:</Text>
                <Text style={[styles.infoValue, styles.valorValue]}>
                  R$ {valorCalculado.valorTotal.toFixed(2)}
                </Text>
              </View>
            </Card.Content>
          </Card>

          <TextInput
            label="Tipo de Pagamento"
            value={pagamentoData.tipo_pagamento}
            onChangeText={(text) => setPagamentoData({ ...pagamentoData, tipo_pagamento: text })}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="cash" />}
            outlineColor={theme.colors.primary}
            activeOutlineColor={theme.colors.primary}
          />

          <TextInput
            label="Número do Documento"
            value={pagamentoData.numero_documento}
            onChangeText={(text) => setPagamentoData({ ...pagamentoData, numero_documento: text })}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
            left={<TextInput.Icon icon="file-document" />}
            outlineColor={theme.colors.primary}
            activeOutlineColor={theme.colors.primary}
          />

          <TextInput
            label="Valor Cobrado"
            value={pagamentoData.valor_cobrado}
            onChangeText={(text) => setPagamentoData({ ...pagamentoData, valor_cobrado: text.replace(/[^0-9.,]/g, '').replace(',', '.') })}
            mode="outlined"
            style={styles.input}
            keyboardType="decimal-pad"
            left={<TextInput.Icon icon="currency-usd" />}
            outlineColor={theme.colors.primary}
            activeOutlineColor={theme.colors.primary}
          />

          <Button
            mode="contained"
            onPress={handleFinalizarPagamento}
            loading={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Confirmar Pagamento
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            contentStyle={styles.buttonContent}
          >
            Cancelar
          </Button>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl,
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
    marginBottom: theme.spacing.xl,
    color: theme.colors.text,
  },
  infoCard: {
    marginBottom: theme.spacing.xl,
    ...theme.shadows.small,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backgroundSecondary,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  valorLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  valorValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  input: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  button: {
    marginTop: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    ...theme.shadows.medium,
  },
  buttonContent: {
    paddingVertical: theme.spacing.sm,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.roundness - 2,
  },
});

