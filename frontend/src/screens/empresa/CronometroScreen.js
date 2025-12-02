import React, { useState, useEffect } from 'react';
import Feather from 'react-native-vector-icons/Feather';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Title, Button } from 'react-native-paper';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { theme } from '../../theme';
import axios from 'axios';
import { api } from '../../config/api';

export default function CronometroScreen({ navigation, route }) {
  const { vaga } = route.params || {};
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  function formatTimer(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  async function handleIniciarPagamento() {
    try {
      setLoading(true);
      await axios.post(`${api.baseURL}/api/vagas/${vaga.id}/iniciar-pagamento`);
      navigation.navigate('SelecionarMetodoPagamento', { vaga });
    } catch (error) {
      console.error('Erro ao iniciar pagamento:', error);

      // Se já estiver pagando ou outro status, tentar navegar para pagamento ou atualizar
      if (error.response?.status === 400) {
        if (error.response?.data?.message === 'Vaga não está estacionada') {
          // Pode ser que já esteja em 'pagando', então vamos para a tela de pagamento
          // Mas idealmente deveríamos verificar o status atual. 
          // Como não temos endpoint de vaga única fácil, vamos assumir que o usuário quer pagar.
          navigation.navigate('SelecionarMetodoPagamento', { vaga });
          return;
        }
      }

      const errorMessage = error.response?.data?.message || 'Erro ao iniciar pagamento';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  if (!vaga) {
    return null;
  }

  const tempoEstacionado = vaga.data_entrada
    ? now - new Date(vaga.data_entrada).getTime()
    : 0;
  const ultrapassouTempo = vaga.tempo_limite
    ? now > new Date(vaga.tempo_limite).getTime()
    : false;
  const timerColor = ultrapassouTempo ? '#EF4444' : '#10B981';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <Title style={styles.title}>Vaga {vaga.numero}</Title>

          <View style={styles.timerContainer}>
            <View style={[styles.timerCircle, { borderColor: timerColor }]}>
              <Text style={[styles.timerText, { color: timerColor }]}>
                {formatTimer(tempoEstacionado)}
              </Text>
              {vaga.tempo_limite && (
                <Text style={[styles.timerLabel, { color: timerColor }]}>
                  {ultrapassouTempo ? 'Tempo Excedido' : 'Tempo Restante'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.ticketContainer}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketTitle}>Detalhes da Vaga</Text>
            </View>

            <View style={styles.ticketBody}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Placa</Text>
                <Text style={styles.infoValue}>{vaga.placa}</Text>
              </View>
              <View style={styles.divider} />

              {vaga.modelo && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Modelo</Text>
                    <Text style={styles.infoValue}>{vaga.modelo}</Text>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              {vaga.data_entrada && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Entrada</Text>
                    <Text style={styles.infoValue}>
                      {format(new Date(vaga.data_entrada), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              {vaga.tempo_limite && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Limite</Text>
                  <Text style={styles.infoValue}>
                    {format(new Date(vaga.tempo_limite), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.ticketFooter}>
              <View style={styles.barcodePlaceholder} />
              <Text style={styles.footerText}>EstacionaAi</Text>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleIniciarPagamento}
            loading={loading}
            style={styles.payButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            icon="cash"
          >
            Finalizar e Pagar
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.backButtonBottom}
            contentStyle={styles.buttonContent}
            textColor={theme.colors.text}
          >
            Voltar
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
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  timerText: {
    fontSize: 40,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  payButton: {
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
  backButtonBottom: {
    width: '100%',
    borderColor: '#4B5563',
    borderRadius: 25,
  },
});
