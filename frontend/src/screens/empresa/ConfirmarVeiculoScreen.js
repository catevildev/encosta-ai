import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Title, Button, Card, CardContent } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

export default function ConfirmarVeiculoScreen({ navigation, route }) {
  const { veiculo, vaga, tempo } = route.params || {};

  function formatarTempo(tempo) {
    if (tempo === null) return 'Não definido (fracionado)';
    return `${tempo / 60} hora(s)`;
  }

  async function handleConfirmar() {
    if (route.params?.onConfirm) {
      await route.params.onConfirm();
    } else {
      // Fallback: fazer confirmação diretamente
      try {
        const { veiculo, vaga, tempo } = route.params;
        const axios = require('axios');
        const { api } = require('../../config/api');
        
        const entradaResponse = await axios.post(`${api.baseURL}/api/registros/entrada`, {
          placa: veiculo.placa,
          tipo: veiculo.tipo
        });
        
        await axios.post(`${api.baseURL}/api/vagas/${vaga.id}/ocupar`, {
          veiculo_id: veiculo.id,
          registro_entrada_id: entradaResponse.data.registro_id,
          tempo_estimado_minutos: tempo
        });
        
        navigation.reset({
          index: 0,
          routes: [{ name: 'EmpresaDashboard' }],
        });
      } catch (error) {
        console.error('Erro ao confirmar:', error);
        Alert.alert('Erro', 'Erro ao confirmar entrada');
      }
    }
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
          <Title style={styles.title}>Confirmar Entrada</Title>

          <Card style={styles.infoCard}>
            <Card.Content>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Vaga:</Text>
                <Text style={styles.infoValue}>{vaga?.numero}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Placa:</Text>
                <Text style={styles.infoValue}>{veiculo?.placa}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Modelo:</Text>
                <Text style={styles.infoValue}>{veiculo?.modelo}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Cor:</Text>
                <Text style={styles.infoValue}>{veiculo?.cor}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tipo:</Text>
                <Text style={styles.infoValue}>{veiculo?.tipo}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tempo:</Text>
                <Text style={styles.infoValue}>{formatarTempo(tempo)}</Text>
              </View>
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={handleConfirmar}
            style={styles.button}
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

