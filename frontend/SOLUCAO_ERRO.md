# Solução para Erro do ExpoCamera

## Problema
- `Cannot find native module 'ExpoCamera'`
- `"main" has not been registered`

## Solução Aplicada

O código foi atualizado para funcionar **mesmo sem a câmera disponível**:

1. ✅ Importação condicional da câmera (não quebra o app)
2. ✅ Fallback automático para digitação manual
3. ✅ Tratamento de erros robusto

## Como usar agora

### Opção 1: Usar apenas digitação (funciona sempre)
- Clique no botão de câmera (FAB)
- Se a câmera não estiver disponível, abrirá automaticamente o input manual
- Digite a placa e confirme

### Opção 2: Habilitar câmera (requer rebuild)

Se quiser usar a câmera, você precisa:

1. **Parar o Metro bundler** (Ctrl+C)

2. **Limpar cache e reinstalar:**
```bash
cd frontend
rm -rf node_modules
npm install
npx expo start -c
```

3. **Para dispositivo físico, fazer rebuild:**
```bash
# Android
npx expo run:android

# iOS  
npx expo run:ios
```

**Nota:** O Expo Go pode não suportar módulos nativos como a câmera. Para produção, use um build nativo.

## Status Atual

✅ **App funciona normalmente** - mesmo sem câmera
✅ **Input manual sempre disponível**
✅ **Câmera opcional** - se disponível, será usada
✅ **Sem erros de inicialização**

O app está funcional e você pode usar normalmente digitando as placas manualmente!

