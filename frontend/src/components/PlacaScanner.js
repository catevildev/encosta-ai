import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform, Image } from 'react-native';
import { Text, Button, Modal, TextInput, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme';

export default function PlacaScanner({ visible, onClose, onPlacaDetected, mode = 'entrada' }) {
  const [capturedImage, setCapturedImage] = useState(null);
  const [placa, setPlaca] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);

  useEffect(() => {
    if (visible) {
      requestPermissions();
    }
  }, [visible]);

  const requestPermissions = async () => {
    try {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      setHasCameraPermission(false);
    }
  };

  const takePicture = async () => {
    try {
      if (hasCameraPermission === false) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permissão necessária',
            'Precisamos de permissão para usar a câmera.',
            [{ text: 'OK' }]
          );
          return;
        }
        setHasCameraPermission(true);
      }

      setProcessing(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        await processOCR(result.assets[0]);
      } else {
        setProcessing(false);
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto. Tente novamente.');
      setProcessing(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar a galeria.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        await processOCR(result.assets[0]);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const processOCR = async (image) => {
    try {
      setProcessing(true);
      
      // Simular processamento OCR - em produção, usar API real
      // Por enquanto, vamos usar uma função simples que extrai texto
      // Você pode integrar com Google Vision API, Tesseract, ou API de placas brasileiras
      
      // Simulação: após 1 segundo, pedir para digitar manualmente
      setTimeout(() => {
        setProcessing(false);
        Alert.alert(
          'Placa não detectada',
          'Não foi possível detectar a placa automaticamente. Por favor, digite manualmente.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Digitar', onPress: () => setShowManualInput(true) }
          ]
        );
      }, 1000);

      // TODO: Integrar com API de OCR real
      // Exemplo com Google Vision API:
      // const base64 = image.base64 || (await FileSystem.readAsStringAsync(image.uri, { encoding: 'base64' }));
      // const response = await fetch('https://vision.googleapis.com/v1/images:annotate?key=SUA_API_KEY', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     requests: [{
      //       image: { content: base64 },
      //       features: [{ type: 'TEXT_DETECTION' }]
      //     }]
      //   })
      // });
      // const data = await response.json();
      // const detectedText = data.responses[0]?.textAnnotations?.[0]?.description;
      // const placaExtraida = extractPlaca(detectedText);
      // if (placaExtraida) {
      //   setPlaca(placaExtraida);
      //   handleConfirm(placaExtraida);
      // } else {
      //   setProcessing(false);
      //   setShowManualInput(true);
      // }
    } catch (error) {
      console.error('Erro no OCR:', error);
      setProcessing(false);
      setShowManualInput(true);
    }
  };

  const extractPlaca = (text) => {
    if (!text) return null;
    // Regex para placas brasileiras (formato antigo e Mercosul)
    const placaRegex = /[A-Z]{3}[0-9][A-Z0-9][0-9]{2}|[A-Z]{3}-?[0-9]{4}/gi;
    const match = text.match(placaRegex);
    if (match) {
      return match[0].replace('-', '').toUpperCase();
    }
    return null;
  };

  const handleConfirm = (placaValue = null) => {
    const placaFinal = placaValue || placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (placaFinal.length >= 7) {
      onPlacaDetected(placaFinal);
      handleClose();
    } else {
      Alert.alert('Placa inválida', 'Por favor, digite uma placa válida (ex: ABC1234 ou ABC1D23)');
    }
  };

  const handleClose = () => {
    setPlaca('');
    setCapturedImage(null);
    setShowManualInput(false);
    setProcessing(false);
    onClose();
  };

  if (!visible) return null;

  if (showManualInput) {
    return (
      <Modal
        visible={visible}
        onDismiss={handleClose}
        contentContainerStyle={styles.modal}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Digite a Placa</Text>
          <IconButton icon="close" onPress={handleClose} />
        </View>
        <TextInput
          label="Placa do Veículo"
          value={placa}
          onChangeText={setPlaca}
          mode="outlined"
          style={styles.input}
          autoCapitalize="characters"
          maxLength={7}
          placeholder="ABC1234 ou ABC1D23"
        />
        <View style={styles.buttonRow}>
          <Button
            mode="outlined"
            onPress={handleClose}
            style={styles.button}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={() => handleConfirm()}
            style={styles.button}
          >
            Confirmar
          </Button>
        </View>
      </Modal>
    );
  }

  if (showManualInput || !visible) {
    return (
      <Modal
        visible={visible}
        onDismiss={handleClose}
        contentContainerStyle={styles.modal}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {mode === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
          </Text>
          <IconButton icon="close" onPress={handleClose} />
        </View>

        {capturedImage && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            <TouchableOpacity
              onPress={() => setCapturedImage(null)}
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
          label="Placa do Veículo"
          value={placa}
          onChangeText={setPlaca}
          mode="outlined"
          style={styles.input}
          autoCapitalize="characters"
          maxLength={7}
          placeholder="ABC1234 ou ABC1D23"
          left={<TextInput.Icon icon="car" />}
        />

        {processing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.processingText}>Processando imagem...</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <Button
            mode="outlined"
            onPress={handleClose}
            style={styles.button}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={() => handleConfirm()}
            style={styles.button}
            disabled={!placa.trim()}
          >
            Confirmar
          </Button>
        </View>
      </Modal>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    ...theme.shadows.large,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
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
});

