import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Clipboard, TouchableOpacity, Text as RNText } from 'react-native';
import { Button, Card, Title, Paragraph, FAB, Portal, Modal, Text, IconButton } from 'react-native-paper';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { theme } from '../../theme';
import { api } from '../../config/api';

export default function AdminDashboard({ navigation }) {
  const { user, signOut } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [error, setError] = useState('');
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');

  useEffect(() => {
    loadEmpresas();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadEmpresas();
    });
    return unsubscribe;
  }, [navigation]);

  async function loadEmpresas() {
    try {
      setError('');
      const response = await axios.get(`${api.baseURL}/api/empresas`);
      setEmpresas(response.data);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      if (error.message === 'Network Error') {
        setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      } else {
        setError('Erro ao carregar empresas. Tente novamente mais tarde.');
      }
    }
  }

  async function handleLogout() {
    try {
      await signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      setError('Erro ao fazer logout. Tente novamente.');
    }
  }

  async function handleResetPassword(empresaId) {
    try {
      setError('');
      const response = await axios.post(`${api.baseURL}/api/empresas/${empresaId}/reset-password`);
      setNovaSenha(response.data.novaSenha);
      setResetPasswordModal(true);
      await Clipboard.setString(response.data.novaSenha);
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Erro ao resetar senha. Tente novamente.');
      }
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.accent]}
          style={styles.welcomeCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Card.Content style={styles.welcomeContent}>
            <Title style={styles.welcomeTitle}>
              Bem-vindo, {user?.nome || 'Administrador'}!</Title>
            <Paragraph style={styles.welcomeSubtitle}>Gerencie suas empresas de estacionamento</Paragraph>
          </Card.Content>
        </LinearGradient>

        <View style={styles.empresasContainer}>
          <Title style={styles.sectionTitle}>Empresas Cadastradas</Title>

          {error ? (
            <Card style={styles.errorCard}>
              <Card.Content>
                <Text style={styles.errorText}>{error}</Text>
                <Button mode="contained" onPress={loadEmpresas} style={styles.retryButton}>
                  Tentar Novamente
                </Button>
              </Card.Content>
            </Card>
          ) : empresas.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Svg width="48" height="48" viewBox="0 0 48 48" fill={theme.colors.primary}>
                  <G fill="none" stroke={theme.colors.primary} stroke-linecap="round" stroke-linejoin="round" strokeWidth="3">
                    <Path d="m17 14l27 10v20H17z" clip-rule="evenodd" />
                    <Path d="M17 14L4 24v20h13m18 0V32l-9-3v15m18 0H17" />
                  </G>
                </Svg>
                <Text style={styles.emptyText}>
                  Nenhuma empresa cadastrada ainda
                </Text>
                <Text style={styles.emptySubtext}>
                  Clique no botão + para adicionar
                </Text>
              </Card.Content>
            </Card>
          ) : (
            empresas.map((empresa) => (
              <TouchableOpacity
                key={empresa.id}
                onPress={() => navigation.navigate('EditarEmpresa', { empresa })}
                activeOpacity={0.7}
              >
                <Card style={styles.empresaCard}>
                  <Card.Content>
                    <View style={styles.empresaHeader}>
                      <View style={styles.empresaInfo}>
                        <View style={styles.empresaIcon}>
                          <Text style={styles.empresaIconText}>
                            {empresa.nome.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.empresaDetails}>
                          <Title style={styles.empresaName}>{empresa.nome}</Title>
                          <Text style={styles.empresaCnpj}>CNPJ: {empresa.cnpj}</Text>
                        </View>
                      </View>
                      <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            navigation.navigate('EditarEmpresa', { empresa });
                          }}
                          style={styles.editButton}
                        >
                          <IconButton
                            icon="pencil"
                            size={20}
                            iconColor={theme.colors.primary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleResetPassword(empresa.id);
                          }}
                          style={styles.resetButton}
                        >
                          <IconButton
                            icon="key"
                            size={20}
                            iconColor={theme.colors.primary}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.empresaData}>
                      <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>📧 Email:</Text>
                        <Text style={styles.dataValue}>{empresa.email}</Text>
                      </View>
                      <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>📞 Telefone:</Text>
                        <Text style={styles.dataValue}>{empresa.telefone}</Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={resetPasswordModal}
          onDismiss={() => setResetPasswordModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Title style={styles.modalTitle}>Nova Senha Gerada</Title>
          <Text style={styles.novaSenhaText}>{novaSenha}</Text>
          <Text style={styles.copiedText}>Senha copiada para a área de transferência!</Text>
          <Button
            mode="contained"
            onPress={() => {
              setResetPasswordModal(false);
              setNovaSenha('');
            }}
            style={styles.button}
          >
            Fechar
          </Button>
        </Modal>
      </Portal>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('CadastrarEmpresa')}
        color="#FFFFFF"
        size="medium"
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  welcomeCard: {
    margin: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    overflow: 'hidden',
    ...theme.shadows.large,
  },
  welcomeContent: {
    padding: theme.spacing.lg,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  empresasContainer: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  empresaCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    ...theme.shadows.medium,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  empresaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  empresaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  empresaIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  empresaIconText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  empresaDetails: {
    flex: 1,
  },
  empresaName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  empresaCnpj: {
    fontSize: 14,
    color: theme.colors.text,
    opacity: 0.7,
  },
  empresaData: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#374151', // Darker border
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
    width: 80,
  },
  dataValue: {
    fontSize: 14,
    color: theme.colors.text,
    opacity: 0.8,
    flex: 1,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  editButton: {
    borderRadius: 8,
    backgroundColor: theme.colors.primary + '15',
  },
  resetButton: {
    borderRadius: 8,
    backgroundColor: theme.colors.primary + '15',
  },
  emptyCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  emptyContent: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    textAlign: 'center',
    fontSize: 14,
    color: theme.colors.text,
    opacity: 0.6,
    lineHeight: 20,
  },
  errorCard: {
    margin: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    backgroundColor: theme.colors.error + '10',
    ...theme.shadows.small,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontSize: 14,
    fontWeight: '500',
  },
  retryButton: {
    marginTop: theme.spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 20,
    backgroundColor: theme.colors.accent,
    ...theme.shadows.medium,
  },
  button: {
    marginTop: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    ...theme.shadows.small,
  },
  modal: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    ...theme.shadows.large,
  },
  modalTitle: {
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  novaSenhaText: {
    fontSize: 28,
    textAlign: 'center',
    marginVertical: theme.spacing.lg,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 2,
  },
  copiedText: {
    textAlign: 'center',
    color: theme.colors.success,
    marginBottom: theme.spacing.md,
    fontSize: 14,
    fontWeight: '600',
  },
  novaSenhaText: {
    fontSize: 28,
    textAlign: 'center',
    marginVertical: theme.spacing.lg,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 2,
  },
  copiedText: {
    textAlign: 'center',
    color: theme.colors.success,
    marginBottom: theme.spacing.md,
    fontSize: 14,
    fontWeight: '600',
  },
}); 