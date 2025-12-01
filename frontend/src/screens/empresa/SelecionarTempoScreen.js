import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Title, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

export default function SelecionarTempoScreen({ navigation, route }) {
  const { vaga } = route.params || {};

  const opcoesTempo = [
    { label: 'Não definido (por tempo fracionado)', value: null },
    { label: '1 hora', value: 60 },
    { label: '2 horas', value: 120 },
    { label: '5 horas', value: 300 },
    { label: '12 horas', value: 720 },
  ];

  function handleSelecionarTempo(tempo) {
    navigation.navigate('ScannerEntrada', { vaga, tempo });
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
        <Surface style={styles.surface}>
          <Title style={styles.title}>Selecione o Tempo</Title>
          <Text style={styles.subtitle}>Vaga {vaga?.numero}</Text>

          {opcoesTempo.map((opcao, index) => (
            <TouchableOpacity
              key={index}
              style={styles.tempoOption}
              onPress={() => handleSelecionarTempo(opcao.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.tempoOptionText}>{opcao.label}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </Surface>
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
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    fontSize: 16,
    color: theme.colors.text,
    opacity: 0.7,
  },
  tempoOption: {
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness - 2,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary + '30',
  },
  tempoOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    backgroundColor: theme.colors.error + '15',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
    textAlign: 'center',
  },
});

