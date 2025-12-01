import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import { Text, Title, Button, TextInput, IconButton, List, Portal, Modal } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../theme';
import axios from 'axios';
import { api } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

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
      tempo,
      onConfirm: async () => {
        await confirmarEntrada(veiculo, vaga, tempo);
      }
    });
  }

  async function confirmarEntrada(veiculo, vaga, tempo) {
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
            >
              Tirar Foto
            </Button>
            <Button
              mode="outlined"
              onPress={pickImage}
              icon="image"
              style={styles.actionButton}
              disabled={processing}
            >
              Galeria
            </Button>
          </View>

          <TextInput
            label="Placa do Veículo *"
            value={placa}
            onChangeText={setPlaca}
            mode="outlined"
            style={styles.input}
            autoCapitalize="characters"
            maxLength={7}
            placeholder="ABC1234 ou ABC1D23"
            left={<TextInput.Icon icon="car" />}
            outlineColor={theme.colors.primary}
            activeOutlineColor={theme.colors.primary}
          />

          <TextInput
            label="Modelo do Veículo *"
            value={modelo}
            onChangeText={setModelo}
            mode="outlined"
            style={styles.input}
            placeholder="Ex: Honda Civic"
            left={<TextInput.Icon icon="car-sports" />}
            outlineColor={theme.colors.primary}
            activeOutlineColor={theme.colors.primary}
          />

          <TextInput
            label="Cor do Veículo *"
            value={cor}
            onChangeText={setCor}
            mode="outlined"
            style={styles.input}
            placeholder="Ex: Branco"
            left={<TextInput.Icon icon="palette" />}
            outlineColor={theme.colors.primary}
            activeOutlineColor={theme.colors.primary}
          />

          <TextInput
            label="Tipo do Veículo *"
            value={tipo === 'carro' ? 'Carro' : tipo === 'moto' ? 'Moto' : 'Caminhão'}
            mode="outlined"
            style={styles.input}
            onPressIn={() => setShowTipoPicker(true)}
            right={<TextInput.Icon icon="chevron-down" />}
            left={<TextInput.Icon icon="car-multiple" />}
            outlineColor={theme.colors.primary}
            activeOutlineColor={theme.colors.primary}
          />

          <Portal>
            <Modal
              visible={showTipoPicker}
              onDismiss={() => setShowTipoPicker(false)}
              contentContainerStyle={styles.pickerModal}
            >
              <List.Item
                title="Carro"
                onPress={() => {
                  setTipo('carro');
                  setShowTipoPicker(false);
                }}
              />
              <List.Item
                title="Moto"
                onPress={() => {
                  setTipo('moto');
                  setShowTipoPicker(false);
                }}
              />
              <List.Item
                title="Caminhão"
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
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirm}
              style={styles.button}
              loading={criandoVeiculo}
              disabled={!placa.trim() || !modelo.trim() || !cor.trim()}
            >
              {criandoVeiculo ? 'Criando Veículo...' : 'Confirmar'}
            </Button>
          </View>
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
  },
  input: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.roundness / 2,
  },
  processingText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.primary,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
    marginTop: theme.spacing.sm,
  },
  pickerModal: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    borderRadius: theme.roundness - 2,
  },
});

