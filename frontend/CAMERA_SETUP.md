# Configuração da Câmera

## Problema resolvido
O erro "Cannot find native module 'ExpoCamera'" foi corrigido instalando a versão compatível do expo-camera (v14.x) para Expo SDK 49.

## Próximos passos

### 1. Reconstruir o app
Após instalar a versão correta do expo-camera, você precisa reconstruir o app:

```bash
# Limpar cache
npx expo start -c

# Ou para desenvolvimento
npm start -- --clear
```

### 2. Para desenvolvimento físico (Android/iOS)
Se estiver testando em dispositivo físico, você precisa fazer um rebuild:

**Android:**
```bash
npx expo run:android
```

**iOS:**
```bash
npx expo run:ios
```

### 3. Para Expo Go
Se estiver usando Expo Go, pode ser necessário:
- Fechar e reabrir o Expo Go
- Ou fazer um rebuild completo do app

## Funcionalidades implementadas

✅ Scanner de placas com câmera
✅ Opção de selecionar da galeria
✅ Digitação manual como fallback
✅ Validação de placas brasileiras (antigas e Mercosul)
✅ Integração automática com registro de entrada/saída

## Próximas melhorias (opcional)

Para melhorar o reconhecimento de placas, você pode integrar:

1. **Google Vision API** - OCR preciso e rápido
2. **Tesseract.js** - OCR offline (mais lento)
3. **APIs específicas de placas** - Reconhecimento especializado

O código está preparado para essas integrações no arquivo `PlacaScanner.js`.

