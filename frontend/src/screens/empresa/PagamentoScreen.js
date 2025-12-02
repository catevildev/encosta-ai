import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Title, Button, Card } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import axios from 'axios';
import { api } from '../../config/api';
import CustomInput from '../../components/CustomInput';

export default function PagamentoScreen({ navigation, route }) {
  const { vaga, metodoPagamento, metodoLabel } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [valorCalculado, setValorCalculado] = useState(null);
  const [pagamentoData, setPagamentoData] = useState({
    tipo_pagamento: metodoPagamento || 'dinheiro',
    numero_documento: '',
    valor_cobrado: '',
  });

  useEffect(() => {
    calcularValor();
  }, []);

  async function calcularValor() {
    if (!vaga?.id) {
      Alert.alert('Erro', 'Dados da vaga inválidos');
      return;
    }

    try {
      console.log(`Calculando valor para vaga ${vaga.id}`);
      const response = await axios.get(`${api.baseURL}/api/vagas/${vaga.id}/calcular-valor`);
      setValorCalculado(response.data);
      setPagamentoData(prev => ({
        ...prev,
        valor_cobrado: response.data.valorTotal.toFixed(2).replace('.', ','),
      }));
    } catch (error) {
      console.error('Erro ao calcular valor:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao calcular valor';

      if (error.response?.status === 400 && errorMessage === 'Configuração de valores não encontrada') {
        Alert.alert(
          'Configuração Necessária',
          `Não há valores configurados para veículos do tipo "${vaga.tipo_veiculo || 'desconhecido'}".\n\nPor favor, vá em "Configurar Valores" e adicione uma configuração para este tipo de veículo.`,
          [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
      } else {
        Alert.alert('Erro', `${errorMessage} (Status: ${error.response?.status})`);
      }
    }
  }

  async function handleFinalizarPagamento() {
    if (!pagamentoData.valor_cobrado) {
      Alert.alert('Atenção', 'Por favor, verifique o valor cobrado');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${api.baseURL}/api/vagas/${vaga.id}/finalizar-saida`, {
        tipo_pagamento: pagamentoData.tipo_pagamento,
        numero_documento: pagamentoData.numero_documento,
        valor_cobrado: parseFloat(pagamentoData.valor_cobrado.replace(',', '.')),
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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Title style={styles.title}>Pagamento</Title>
        </View>

        <View style={styles.ticketContainer}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketTitle}>Detalhes do Pagamento</Text>
          </View>

          <View style={styles.ticketBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Placa</Text>
              <Text style={styles.infoValue}>{vaga.placa}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tempo</Text>
              <Text style={styles.infoValue}>
                {valorCalculado.horas}h {valorCalculado.minutos}m
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Forma Pagto.</Text>
              <Text style={styles.infoValue}>{metodoLabel || pagamentoData.tipo_pagamento}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>
                R$ {valorCalculado.valorTotal.toFixed(2).replace('.', ',')}
              </Text>
            </View>
          </View>

          <View style={styles.ticketFooter}>
            <View style={styles.barcodePlaceholder} />
            <Text style={styles.footerText}>EstacionaAi</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          {pagamentoData.tipo_pagamento !== 'dinheiro' && pagamentoData.tipo_pagamento !== 'pix' && (
            <CustomInput
              placeholder="Número do Documento (Opcional)"
              value={pagamentoData.numero_documento}
              onChangeText={(text) => setPagamentoData({ ...pagamentoData, numero_documento: text })}
              keyboardType="numeric"
              icon="file-document"
            />
          )}

          <CustomInput
            placeholder="Valor Cobrado (R$)"
            value={pagamentoData.valor_cobrado}
            onChangeText={(text) => {
              // Permitir apenas números e vírgula/ponto
              let newText = text.replace(/[^0-9.,]/g, '');
              // Substituir ponto por vírgula para visualização
              newText = newText.replace('.', ',');
              setPagamentoData({ ...pagamentoData, valor_cobrado: newText });
            }}
            keyboardType="decimal-pad"
            icon="currency-brl"
          />
        </View>

        <Button
          mode="contained"
          onPress={handleFinalizarPagamento}
          loading={loading}
          style={styles.confirmButton}
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
          textColor={theme.colors.text}
        >
          Voltar
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    alignItems: 'center',
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  ticketContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: theme.spacing.xl,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  ticketHeader: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  ticketTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ticketBody: {
    padding: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
    marginVertical: 4,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  ticketFooter: {
    backgroundColor: '#F9FAFB',
    padding: theme.spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  barcodePlaceholder: {
    height: 40,
    width: '80%',
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
    borderRadius: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  confirmButton: {
    width: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: 25,
    marginBottom: theme.spacing.md,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cancelButton: {
    width: '100%',
    borderColor: '#4B5563',
    borderRadius: 25,
  },
});


