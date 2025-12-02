import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Text, Title, Button } from 'react-native-paper';
import { theme } from '../../theme';
import Feather from 'react-native-vector-icons/Feather';

export default function SelecionarTempoScreen({ navigation, route }) {
  const { vaga } = route.params || {};
  const [selectedTempo, setSelectedTempo] = useState(null);

  const opcoesTempo = [
    { label: 'Não informar', value: null },
    { label: 'Máximo 1 hora', value: 60 },
    { label: 'Máximo 2 horas', value: 120 },
    { label: 'Máximo 5 horas', value: 300 },
    { label: 'Máximo 12 horas', value: 720 },
  ];

  function handleConfirmar() {
    navigation.navigate('ScannerEntrada', { vaga, tempo: selectedTempo });
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mapContainer}>
          <Image
            source={require('../../assets/map-placeholder.png')}
            style={styles.mapImage}
            resizeMode="cover"
          />
          <View style={styles.spotSign}>
            <Text style={styles.spotSignText}>{vaga?.numero}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Selecione a regra de tempo do local:</Text>

        <View style={styles.optionsContainer}>
          {opcoesTempo.map((opcao, index) => {
            const isSelected = selectedTempo === opcao.value;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected
                ]}
                onPress={() => setSelectedTempo(opcao.value)}
                activeOpacity={0.7}
              >
                <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                  {isSelected && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {opcao.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          mode="contained"
          onPress={handleConfirmar}
          style={styles.confirmButton}
          contentStyle={styles.confirmButtonContent}
          labelStyle={styles.confirmButtonLabel}
        >
          CONFIRMAR
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
  },
  mapContainer: {
    height: 180,
    borderRadius: theme.roundness,
    overflow: 'hidden',
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  spotSign: {
    position: 'absolute',
    backgroundColor: '#1E3A8A', // Azul escuro tipo placa
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  spotSignText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: theme.spacing.xl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#FFFFFF', // Borda branca quando selecionado
    backgroundColor: '#374151', // Um pouco mais claro que a surface
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6B7280', // Cinza para não selecionado
    marginRight: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#FFFFFF', // Branco quando selecionado
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  optionTextSelected: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmButton: {
    backgroundColor: theme.colors.success,
    borderRadius: 25,
    marginTop: theme.spacing.sm,
  },
  confirmButtonContent: {
    paddingVertical: 8,
  },
  confirmButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});


