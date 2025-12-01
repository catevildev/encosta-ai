import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Title, Button, Card } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
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
      navigation.navigate('Pagamento', { vaga });
    } catch (error) {
      console.error('Erro ao iniciar pagamento:', error);
      alert('Erro ao iniciar pagamento');
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

          <Card style={styles.infoCard}>
            <Card.Content>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Placa:</Text>
                <Text style={styles.infoValue}>{vaga.placa}</Text>
              </View>
              {vaga.modelo && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Modelo:</Text>
                  <Text style={styles.infoValue}>{vaga.modelo}</Text>
                </View>
              )}
              {vaga.data_entrada && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Entrada:</Text>
                  <Text style={styles.infoValue}>
                    {format(new Date(vaga.data_entrada), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </Text>
                </View>
              )}
              {vaga.tempo_limite && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Limite:</Text>
                  <Text style={styles.infoValue}>
                    {format(new Date(vaga.tempo_limite), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={handleIniciarPagamento}
            loading={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            icon="cash"
          >
            Finalizar e Pagar
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            contentStyle={styles.buttonContent}
          >
            Voltar
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
  timerContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: theme.spacing.xs,
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

