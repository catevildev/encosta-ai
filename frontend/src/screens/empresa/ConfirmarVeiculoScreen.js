import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Title, Button } from 'react-native-paper';
import { theme } from '../../theme';
import axios from 'axios';
import { api } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

export default function ConfirmarVeiculoScreen({ navigation, route }) {
  const { veiculo, vaga, tempo } = route.params || {};
  const { signOut } = useAuth();

  function formatarTempo(tempo) {
    if (tempo === null) return 'Não definido (fracionado)';
    return `${tempo / 60} hora(s)`;
  }

  async function handleConfirmar() {
    try {
      // Registrar entrada (cria veículo automaticamente se não existir)
      const entradaResponse = await axios.post(`${api.baseURL}/api/registros/entrada`, {
        placa: veiculo.placa,
        tipo: veiculo.tipo,
        modelo: veiculo.modelo,
        cor: veiculo.cor
      });

      // Atualizar veiculo.id caso tenha sido criado
      const veiculoId = entradaResponse.data.veiculo?.id || veiculo.id;

      await axios.post(`${api.baseURL}/api/vagas/${vaga.id}/ocupar`, {
        veiculo_id: veiculoId,
        registro_entrada_id: entradaResponse.data.registro_id,
        tempo_estimado_minutos: tempo
      });

      Alert.alert('Sucesso', 'Entrada registrada com sucesso!', [
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
      console.error('Erro ao confirmar entrada:', error);

      // Se a empresa não foi encontrada, fazer logout e pedir para fazer login novamente
      if (error.response?.status === 404 && error.response?.data?.error === 'Empresa não encontrada') {
        Alert.alert(
          'Sessão Expirada',
          'Sua sessão expirou ou a empresa não foi encontrada. Por favor, faça login novamente.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await signOut();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              },
            },
          ]
        );
        return;
      }

      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.response?.data?.details || 'Erro ao confirmar entrada. Tente novamente.';
      Alert.alert('Erro', errorMessage);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <Title style={styles.title}>Confirmar Entrada</Title>

          <View style={styles.ticketContainer}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketTitle}>Comprovante de Entrada</Text>
            </View>

            <View style={styles.ticketBody}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Vaga</Text>
                <Text style={styles.infoValue}>{vaga?.numero}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Placa</Text>
                <Text style={styles.infoValue}>{veiculo?.placa}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Modelo</Text>
                <Text style={styles.infoValue}>{veiculo?.modelo}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Cor</Text>
                <Text style={styles.infoValue}>{veiculo?.cor}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tipo</Text>
                <Text style={styles.infoValue}>{veiculo?.tipo === 'carro' ? 'Carro' : veiculo?.tipo === 'moto' ? 'Moto' : 'Caminhão'}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tempo</Text>
                <Text style={styles.infoValue}>{formatarTempo(tempo)}</Text>
              </View>
            </View>

            <View style={styles.ticketFooter}>
              <View style={styles.barcodePlaceholder} />
              <Text style={styles.footerText}>Encosta Aí</Text>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleConfirmar}
            style={styles.confirmButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Confirmar
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            contentStyle={styles.buttonContent}
            textColor={theme.colors.text}
          >
            Cancelar
          </Button>
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
  scrollContent: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  contentContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: theme.spacing.xl,
    color: theme.colors.text,
  },
  ticketContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF', // Ticket branco
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
    color: '#6B7280', // Cinza escuro
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827', // Preto quase total
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB', // Cinza claro
    width: '100%',
    marginVertical: 4,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 1,
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
