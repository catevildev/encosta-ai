import React, { useState, useEffect } from 'react';
import Feather from 'react-native-vector-icons/Feather';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import { Text, Title, Button, IconButton, List, Portal, Modal } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../theme';
import axios from 'axios';
import { api } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import CustomInput from '../../components/CustomInput';

export default function ScannerEntradaScreen({ navigation, route }) {
  const { vaga, tempo } = route.params || {};
  const { user, signOut } = useAuth();
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [tipo, setTipo] = useState('carro');
  const [capturedImage, setCapturedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [veiculosCadastrados, setVeiculosCadastrados] = useState([]);
  const [showTipoPicker, setShowTipoPicker] = useState(false);
  const [criandoVeiculo, setCriandoVeiculo] = useState(false);

  useEffect(() => {
    loadVeiculos();
    requestPermissions();
  }, []);

  async function loadVeiculos() {
    try {
      const response = await axios.get(`${api.baseURL}/api/veiculos`);
      setVeiculosCadastrados(response.data);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
    }
  }

  const requestPermissions = async () => {
    try {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus.status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para usar a câmera. Você pode digitar a placa manualmente.',
          [{ text: 'OK' }]
        );
      }
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
    }
  };

  const takePicture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para usar a câmera. Por favor, digite a placa manualmente.',
          [{ text: 'OK' }]
        );
        return;
      }

      setProcessing(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        // Simular processamento OCR - em produção usar API real
        setTimeout(() => {
          setProcessing(false);
          Alert.alert(
            'Placa não detectada',
            'Não foi possível detectar a placa automaticamente. Por favor, digite manualmente.',
            [{ text: 'OK' }]
          );
        }, 1000);
      } else {
        setProcessing(false);
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto. Por favor, digite a placa manualmente.');
      setProcessing(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        setShowManualInput(true);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const handleConfirm = async () => {
    const placaFinal = placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (placaFinal.length < 7) {
      Alert.alert('Placa inválida', 'Por favor, digite uma placa válida (ex: ABC1234 ou ABC1D23)');
      return;
    }

    if (!modelo.trim() || !cor.trim()) {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha o modelo e a cor do veículo.');
      return;
    }

    await handlePlacaDetected(placaFinal);
  };

  async function handlePlacaDetected(placaFinal) {
    let veiculo = veiculosCadastrados.find(v => v.placa === placaFinal);

    // Se veículo não existe, criar automaticamente
    if (!veiculo) {
      try {
        setCriandoVeiculo(true);
        const response = await axios.post(`${api.baseURL}/api/veiculos`, {
          placa: placaFinal,
          modelo: modelo.trim(),
          cor: cor.trim(),
          tipo: tipo
        });

        veiculo = {
          id: response.data.id,
          placa: placaFinal,
          modelo: modelo.trim(),
          cor: cor.trim(),
          tipo: tipo
        };

        // Atualizar lista de veículos
        await loadVeiculos();
      } catch (error) {
        console.error('Erro ao criar veículo:', error);
        Alert.alert('Erro', error.response?.data?.message || 'Erro ao criar veículo. Tente novamente.');
        setCriandoVeiculo(false);
        return;
      } finally {
        setCriandoVeiculo(false);
      }
    }

    // Navegar para tela de confirmação
    navigation.navigate('ConfirmarVeiculo', {
      veiculo,
      vaga,
      tempo
    });
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Title style={styles.headerTitle}>Rotativo Digital</Title>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.surface}>
          <Title style={styles.title}>Escanear Placa</Title>
          <Text style={styles.subtitle}>Vaga {vaga?.numero}</Text>

          {capturedImage && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: capturedImage }} style={styles.previewImage} />
              <TouchableOpacity
                onPress={() => {
                  setCapturedImage(null);
                  setShowManualInput(false);
                }}
                style={styles.removeImageButton}
              >
                <IconButton icon="close-circle" iconColor={theme.colors.error} size={24} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={takePicture}
              icon="camera"
              style={styles.actionButton}
              disabled={processing}
              textColor={theme.colors.text}
            >
              Tirar Foto
            </Button>
            <Button
              mode="outlined"
              onPress={pickImage}
              icon="image"
              style={styles.actionButton}
              disabled={processing}
              textColor={theme.colors.text}
            >
              Galeria
            </Button>
          </View>

          <CustomInput
            placeholder="Placa do Veículo *"
            value={placa}
            onChangeText={(text) => setPlaca(text.toUpperCase())}
            autoCapitalize="characters"
            maxLength={7}
            icon="car"
          />

          <CustomInput
            placeholder="Modelo do Veículo *"
            value={modelo}
            onChangeText={setModelo}
            icon="car-sports"
          />

          <CustomInput
            placeholder="Cor do Veículo *"
            value={cor}
            onChangeText={setCor}
            icon="palette"
          />

          <TouchableOpacity onPress={() => setShowTipoPicker(true)}>
            <View pointerEvents="none">
              <CustomInput
                placeholder="Tipo do Veículo *"
                value={tipo === 'carro' ? 'Carro' : tipo === 'moto' ? 'Moto' : 'Caminhão'}
                icon="car-multiple"
                rightIcon="chevron-down"
                editable={false}
              />
            </View>
          </TouchableOpacity>

          <Portal>
            <Modal
              visible={showTipoPicker}
              onDismiss={() => setShowTipoPicker(false)}
              contentContainerStyle={styles.pickerModal}
            >
              <List.Item
                title="Carro"
                titleStyle={{ color: theme.colors.text }}
                onPress={() => {
                  setTipo('carro');
                  setShowTipoPicker(false);
                }}
              />
              <List.Item
                title="Moto"
                titleStyle={{ color: theme.colors.text }}
                onPress={() => {
                  setTipo('moto');
                  setShowTipoPicker(false);
                }}
              />
              <List.Item
                title="Caminhão"
                titleStyle={{ color: theme.colors.text }}
                onPress={() => {
                  setTipo('caminhao');
                  setShowTipoPicker(false);
                }}
              />
            </Modal>
          </Portal>

          {processing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.processingText}>Processando imagem...</Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.button}
              textColor={theme.colors.text}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirm}
              style={styles.confirmButton}
              loading={criandoVeiculo}
              disabled={!placa.trim() || !modelo.trim() || !cor.trim()}
            >
              {criandoVeiculo ? 'Criando...' : 'Confirmar'}
            </Button>
          </View>
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
    color: '#9CA3AF',
  },
  imagePreview: {
    position: 'relative',
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    borderColor: '#4B5563',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface + '40',
    borderRadius: theme.roundness / 2,
  },
  processingText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  button: {
    flex: 1,
    borderColor: '#4B5563',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: theme.colors.success,
  },
  pickerModal: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
});

