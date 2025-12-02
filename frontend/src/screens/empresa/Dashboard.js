import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Clipboard, TouchableOpacity, Text as RNText, Alert } from 'react-native';
import { Button, Card, Title, Paragraph, FAB, Portal, Modal, TextInput, Text, DataTable, IconButton, Menu, RadioButton, List } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { theme } from '../../theme';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../../config/api';
import { User, Car, List as ListIcon, LogOut, Plus, SquareParking, ArrowDownRight, ArrowUpRight } from 'lucide-react-native';
import Feather from 'react-native-vector-icons/Feather';
import PlacaScanner from '../../components/PlacaScanner';

export default function EmpresaDashboard({ navigation }) {
  const { user, signOut } = useAuth();
  const [vagas, setVagas] = useState([]);
  const [veiculosCadastrados, setVeiculosCadastrados] = useState([]);
  const [visible, setVisible] = useState(false);
  const [veiculosModal, setVeiculosModal] = useState(false);
  const [saidaModal, setSaidaModal] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerMode, setScannerMode] = useState('entrada');
  const [vagaSelecionada, setVagaSelecionada] = useState(null);
  const [vagaModalVisible, setVagaModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [senhaSaida, setSenhaSaida] = useState('');
  const [veiculoSaida, setVeiculoSaida] = useState(null);
  const [formData, setFormData] = useState({
    placa: '',
    modelo: '',
    cor: '',
    tipo: 'carro',
  });
  const [showPicker, setShowPicker] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadData();
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      setError('');
      const [vagasResponse, veiculosCadastradosResponse] = await Promise.all([
        axios.get(`${api.baseURL}/api/vagas`),
        axios.get(`${api.baseURL}/api/veiculos`),
      ]);

      setVagas(vagasResponse.data);
      setVeiculosCadastrados(veiculosCadastradosResponse.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      if (error.message === 'Network Error') {
        setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      } else {
        setError('Erro ao carregar dados. Tente novamente mais tarde.');
      }
    }
  }

  function getVagaColor(status) {
    switch (status) {
      case 'disponivel':
        return '#10B981'; // Verde
      case 'estacionado':
        return '#F59E0B'; // Laranja
      case 'pagando':
        return '#3B82F6'; // Azul
      case 'indisponivel':
      case 'manutencao':
        return '#9CA3AF'; // Cinza
      default:
        return '#9CA3AF';
    }
  }

  function getVagaStatusText(status) {
    switch (status) {
      case 'disponivel':
        return 'Disponível';
      case 'estacionado':
        return 'Estacionado';
      case 'pagando':
        return 'Pagando';
      case 'indisponivel':
        return 'Indisponível';
      case 'manutencao':
        return 'Manutenção';
      default:
        return status;
    }
  }

  function formatTimer(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  const [vagaParaEntrada, setVagaParaEntrada] = useState(null);

  function handleVagaPress(vaga) {
    if (vaga.status === 'estacionado') {
      // Navegar para tela de cronômetro
      navigation.navigate('Cronometro', { vaga });
    } else if (vaga.status === 'pagando') {
      // Navegar para tela de pagamento
      navigation.navigate('Pagamento', { vaga });
    } else if (vaga.status === 'disponivel') {
      // Navegar para tela de seleção de tempo
      navigation.navigate('SelecionarTempo', { vaga });
    } else if (vaga.status === 'indisponivel' || vaga.status === 'manutencao') {
      // Mostrar opção para marcar como disponível
      Alert.alert(
        'Vaga Indisponível',
        'Deseja marcar esta vaga como disponível?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Marcar como Disponível',
            onPress: async () => {
              try {
                await axios.put(`${api.baseURL}/api/vagas/${vaga.id}/status`, { status: 'disponivel' });
                loadData();
              } catch (error) {
                console.error('Erro ao atualizar status:', error);
                alert('Erro ao atualizar status da vaga');
              }
            }
          }
        ]
      );
    }
  }


  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      await axios.post(`${api.baseURL}/api/veiculos`, formData);
      setVisible(false);
      loadData();
      setFormData({
        placa: '',
        modelo: '',
        cor: '',
        tipo: 'carro',
      });
    } catch (error) {
      console.error('Erro ao cadastrar veículo:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Erro ao cadastrar veículo. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEntrada(placa, vagaId = null) {
    try {
      setError('');

      // Registrar entrada (cria veículo automaticamente se não existir)
      const entradaResponse = await axios.post(`${api.baseURL}/api/registros/entrada`, {
        placa: placa,
        tipo: 'carro' // Tipo padrão quando não especificado
      });

      const veiculoId = entradaResponse.data.veiculo?.id;

      // Se houver vaga selecionada, ocupar a vaga
      if (vagaId && entradaResponse.data.registro_id && veiculoId) {
        await axios.post(`${api.baseURL}/api/vagas/${vagaId}/ocupar`, {
          veiculo_id: veiculoId,
          registro_entrada_id: entradaResponse.data.registro_id
        });
      }

      loadData();
      setVagaParaEntrada(null);
      alert('Entrada registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar entrada:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
        alert(error.response.data.error + (error.response.data.details ? '\n' + error.response.data.details : ''));
      } else {
        setError('Erro ao registrar entrada. Tente novamente.');
        alert('Erro ao registrar entrada. Tente novamente.');
      }
    }
  }

  async function handleSaida(veiculo) {
    setVeiculoSaida(veiculo);
    setSaidaModal(true);
  }

  async function confirmarSaida() {
    try {
      setError('');
      console.log('Saída payload:', { placa: veiculoSaida.placa, senha: senhaSaida });
      const response = await axios.post(`${api.baseURL}/api/registros/saida`, {
        placa: veiculoSaida.placa,
        senha: senhaSaida,
      });

      // Liberar a vaga associada ao veículo
      const vagaOcupada = vagas.find(v => v.veiculo_id === veiculoSaida.id && (v.status === 'estacionado' || v.status === 'pagando'));
      if (vagaOcupada) {
        await axios.post(`${api.baseURL}/api/vagas/${vagaOcupada.id}/liberar`);
      }

      setSaidaModal(false);
      setSenhaSaida('');
      setVeiculoSaida(null);
      loadData();

      // Mostrar notificação de saída
      alert(
        `${user?.nome || 'Estacionamento'}\n\nSaída registrada!\nPlaca: ${response.data.placa}\nValor: R$ ${Number(response.data.valorTotal).toFixed(2)}\nTempo: ${response.data.tempoPermanencia}`
      );
    } catch (error) {
      console.error('Erro ao registrar saída:', error);
      if (error.response?.data) {
        console.log('Erro detalhado do backend:', error.response.data);
      }
      if (error.response?.data?.message || error.response?.data?.error || error.response?.data?.details) {
        setError(
          error.response.data.message ||
          error.response.data.error ||
          error.response.data.details ||
          JSON.stringify(error.response.data)
        );
      } else {
        setError('Erro ao registrar saída. Tente novamente.');
      }
    }
  }

  function handleConfigValores() {
    navigation.navigate('ConfigValores');
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
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconWrapper}>
                  <SquareParking size={24} color="#FFFFFF" />
                </View>
                <View style={{ width: '80%', paddingRight: 10 }}>
                  <Title style={styles.welcomeTitle}>Bem-vindo,</Title>
                  <Title style={styles.welcomeTitle}>Estacionamento 24H !</Title>
                  <Paragraph style={styles.welcomeSubtitle}>Gerencie seu estacionamento</Paragraph>
                </View>
              </View>
            </View>
          </Card.Content>
        </LinearGradient>

        <View style={styles.configButtonContainer}>
          <Button
            mode="contained"
            onPress={handleConfigValores}
            icon="cog"
            style={styles.configButton}
            contentStyle={styles.configButtonContent}
            labelStyle={styles.configButtonLabel}
          >
            Configurar Valores
          </Button>
        </View>

        {error ? (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text style={styles.errorText}>{error}</Text>
              <Button mode="contained" onPress={loadData} style={styles.retryButton}>
                Tentar Novamente
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <SquareParking size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Title style={[styles.sectionTitle, { marginBottom: 0, color: '#FFFFFF' }]}>Vagas de Estacionamento</Title>
                </View>
              </View>

              {vagas.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <Card.Content>
                    <Text style={styles.emptyText}>
                      Nenhuma vaga configurada.
                    </Text>
                    <Text style={styles.emptySubtext}>
                      As vagas serão criadas automaticamente.
                    </Text>
                  </Card.Content>
                </Card>
              ) : (
                <View style={styles.vagasGrid}>
                  {vagas.map((vaga) => {
                    const vagaColor = getVagaColor(vaga.status);
                    const tempoEstacionado = vaga.data_entrada
                      ? now - new Date(vaga.data_entrada).getTime()
                      : 0;

                    return (
                      <TouchableOpacity
                        key={vaga.id}
                        onPress={() => handleVagaPress(vaga)}
                        onLongPress={() => {
                          if (vaga.status === 'disponivel') {
                            Alert.alert(
                              'Opções da Vaga',
                              'Escolha uma opção',
                              [
                                { text: 'Cancelar', style: 'cancel' },
                                {
                                  text: 'Marcar como Indisponível',
                                  onPress: async () => {
                                    try {
                                      await axios.put(`${api.baseURL}/api/vagas/${vaga.id}/status`, { status: 'indisponivel' });
                                      loadData();
                                    } catch (error) {
                                      console.error('Erro ao atualizar status:', error);
                                      alert('Erro ao atualizar status da vaga');
                                    }
                                  }
                                }
                              ]
                            );
                          }
                        }}
                        style={[styles.vagaCard, { borderLeftColor: vagaColor, borderLeftWidth: 4, backgroundColor: '#2B2B2B' }]}
                        activeOpacity={0.7}
                      >
                        <View style={styles.vagaHeader}>
                          <Text style={[styles.vagaNumero, { color: '#FFFFFF' }]}>Vaga {vaga.numero}</Text>
                          <View style={[styles.vagaStatusBadge, { backgroundColor: vagaColor + '20' }]}>
                            <Text style={[styles.vagaStatusText, { color: vagaColor }]}>
                              {getVagaStatusText(vaga.status)}
                            </Text>
                          </View>
                        </View>
                        {vaga.status === 'estacionado' && vaga.placa && (
                          <View style={styles.vagaInfo}>
                            <Text style={[styles.vagaPlaca, { color: '#FFFFFF' }]}>{vaga.placa}</Text>
                            {vaga.data_entrada && (
                              <Text style={[styles.vagaTimer, { color: '#FFFFFF' }]}>
                                {formatTimer(tempoEstacionado)}
                              </Text>
                            )}
                          </View>
                        )}
                        {vaga.status === 'pagando' && vaga.placa && (
                          <View style={styles.vagaInfo}>
                            <Text style={[styles.vagaPlaca, { color: '#FFFFFF' }]}>{vaga.placa}</Text>
                            {vaga.data_entrada && (
                              <Text style={[styles.vagaTimer, { color: '#FFFFFF' }]}>
                                {formatTimer(tempoEstacionado)}
                              </Text>
                            )}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <SquareParking size={22} color={theme.colors.primary} style={{ marginRight: 12 }} />
            <Title style={[styles.modalTitle, { marginBottom: 0 }]}>Cadastrar Novo Veículo</Title>
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <TextInput
            label="Placa"
            value={formData.placa}
            onChangeText={(text) => setFormData({ ...formData, placa: text })}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Modelo"
            value={formData.modelo}
            onChangeText={(text) => setFormData({ ...formData, modelo: text })}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Cor"
            value={formData.cor}
            onChangeText={(text) => setFormData({ ...formData, cor: text })}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Tipo"
            value={formData.tipo}
            mode="outlined"
            style={styles.input}
            onPressIn={() => setShowPicker(true)}
            right={<TextInput.Icon name="chevron-down" />}
          />
          <Portal>
            <Modal
              visible={showPicker}
              onDismiss={() => setShowPicker(false)}
              contentContainerStyle={styles.pickerModal}
            >
              <List.Item
                title="Carro"
                onPress={() => {
                  setFormData({ ...formData, tipo: 'carro' });
                  setShowPicker(false);
                }}
              />
              <List.Item
                title="Moto"
                onPress={() => {
                  setFormData({ ...formData, tipo: 'moto' });
                  setShowPicker(false);
                }}
              />
              <List.Item
                title="Caminhão"
                onPress={() => {
                  setFormData({ ...formData, tipo: 'caminhao' });
                  setShowPicker(false);
                }}
              />
            </Modal>
          </Portal>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            style={styles.button}
          >
            Cadastrar
          </Button>
        </Modal>

        <Modal
          visible={saidaModal}
          onDismiss={() => {
            setSaidaModal(false);
            setSenhaSaida('');
            setVeiculoSaida(null);
          }}
          contentContainerStyle={styles.modal}
        >
          <Title style={styles.modalTitle}>Confirmar Saída</Title>
          <Text style={styles.saidaText}>Placa: {veiculoSaida?.placa}</Text>
          <TextInput
            label="Senha da Empresa"
            value={senhaSaida}
            onChangeText={setSenhaSaida}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={confirmarSaida}
            style={styles.button}
          >
            Confirmar Saída
          </Button>
        </Modal>

        <Modal
          visible={veiculosModal}
          onDismiss={() => setVeiculosModal(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalHeader}>
            <Title style={[styles.modalTitle, { marginBottom: 0, flex: 1 }]}>Veículos Cadastrados</Title>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setVeiculosModal(false)}
            />
          </View>
          <ScrollView style={styles.modalScrollView}>
            {veiculosCadastrados.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum veículo cadastrado ainda.</Text>
            ) : (
              veiculosCadastrados.map((veiculo) => (
                <Card key={veiculo.id} style={styles.veiculoCardModal}>
                  <Card.Content>
                    <View style={styles.veiculoHeader}>
                      <View style={styles.veiculoInfo}>
                        <View style={styles.veiculoIcon}>
                          <Car size={20} color={theme.colors.primary} />
                        </View>
                        <View>
                          <Title style={styles.veiculoPlaca}>{veiculo.placa}</Title>
                          <Text style={styles.veiculoTipo}>{veiculo.tipo}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.veiculoDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Modelo:</Text>
                        <Text style={styles.detailValue}>{veiculo.modelo}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Cor:</Text>
                        <Text style={styles.detailValue}>{veiculo.cor}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={async () => {
                        // Encontrar primeira vaga disponível
                        const vagaDisponivel = vagas.find(v => v.status === 'disponivel');
                        if (vagaDisponivel) {
                          await handleEntrada(veiculo.placa, vagaDisponivel.id);
                          setVeiculosModal(false);
                        } else {
                          alert('Não há vagas disponíveis no momento.');
                        }
                      }}
                      style={[styles.actionButton, styles.entradaButton]}
                    >
                      <Feather name="arrow-down-circle" size={18} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Registrar Entrada</Text>
                    </TouchableOpacity>
                  </Card.Content>
                </Card>
              ))
            )}
          </ScrollView>
          <Button
            mode="contained"
            onPress={() => {
              setVeiculosModal(false);
              setVisible(true);
            }}
            style={styles.button}
            icon="plus"
          >
            Cadastrar Novo Veículo
          </Button>
        </Modal>

      </Portal>

      <FAB
        style={styles.fab}
        icon="camera"
        onPress={() => {
          setScannerMode('entrada');
          setScannerVisible(true);
        }}
        color="#FFFFFF"
        size="medium"
      />



      <PlacaScanner
        visible={scannerVisible}
        onClose={() => {
          setScannerVisible(false);
          setVagaParaEntrada(null);
        }}
        onPlacaDetected={async (placa) => {
          // Verificar se veículo existe
          const veiculo = veiculosCadastrados.find(v => v.placa === placa);
          if (veiculo) {
            if (scannerMode === 'entrada') {
              await handleEntrada(placa, vagaParaEntrada?.id);
              setVagaParaEntrada(null);
            } else {
              // Para saída, precisamos encontrar a vaga ocupada pelo veículo
              const vagaOcupada = vagas.find(v => v.placa === placa && (v.status === 'estacionado' || v.status === 'pagando'));
              if (vagaOcupada) {
                const veiculoEstacionado = {
                  id: vagaOcupada.veiculo_id,
                  placa: vagaOcupada.placa,
                  modelo: vagaOcupada.modelo,
                  cor: vagaOcupada.cor,
                  tipo: vagaOcupada.tipo_veiculo
                };
                handleSaida(veiculoEstacionado);
              } else {
                alert('Este veículo não está estacionado no momento.');
              }
            }
          } else {
            // Veículo não cadastrado - fechar scanner silenciosamente
            // O usuário deve usar o fluxo de entrada através da vaga
            setScannerVisible(false);
          }
        }}
        mode={scannerMode}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  configButtonContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  configButton: {
    borderRadius: theme.roundness - 2,
    ...theme.shadows.small,
  },
  configButtonContent: {
    paddingVertical: theme.spacing.xs,
  },
  configButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  manageButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 8,
    backgroundColor: theme.colors.primary + '15',
  },
  manageButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    ...theme.shadows.medium,
    overflow: 'hidden',
  },
  veiculoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  veiculoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  veiculoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  veiculoPlaca: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  veiculoTipo: {
    fontSize: 12,
    color: theme.colors.text,
    opacity: 0.6,
    textTransform: 'capitalize',
  },
  timerBadge: {
    backgroundColor: theme.colors.warning + '20',
    borderRadius: 8,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  timerText: {
    fontWeight: '700',
    color: theme.colors.warning,
    fontSize: 12,
  },
  veiculoDetails: {
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backgroundSecondary,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
    width: 70,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    opacity: 0.8,
    flex: 1,
  },
  emptyCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    textAlign: 'center',
    fontSize: 14,
    color: theme.colors.text,
    opacity: 0.6,
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
    marginBottom: 10,
  },
  retryButton: {
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness - 2,
    ...theme.shadows.small,
  },
  entradaButton: {
    backgroundColor: theme.colors.success,
  },
  saidaButton: {
    backgroundColor: theme.colors.error,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: theme.spacing.xs,
  },
  button: {
    marginHorizontal: 5,
  },
  vagasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  vagaCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness - 2,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  vagaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  vagaNumero: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  vagaStatusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vagaStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  vagaInfo: {
    marginTop: theme.spacing.xs,
  },
  vagaPlaca: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  vagaTimer: {
    fontSize: 12,
    color: theme.colors.text,
    opacity: 0.7,
  },
  vagaModal: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    ...theme.shadows.large,
  },
  vagaModalTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontSize: 24,
    fontWeight: '700',
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
    borderColor: theme.colors.primary,
  },
  timerText: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.primary,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  vagaInfoCard: {
    marginBottom: theme.spacing.lg,
    ...theme.shadows.small,
  },
  vagaInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  vagaInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    opacity: 0.7,
  },
  vagaInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  vagaModalButton: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.roundness - 2,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 70,
    backgroundColor: theme.colors.accent,
    ...theme.shadows.medium,
  },
  modal: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    ...theme.shadows.large,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: 400,
    marginBottom: theme.spacing.md,
  },
  veiculoCardModal: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    ...theme.shadows.small,
  },
  input: {
    marginBottom: 15,
  },
  logoutButton: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    opacity: 0.6,
    letterSpacing: 0.3,
  },
  saidaText: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  pickerModal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
  },
  vagasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  vagaCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness - 2,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  vagaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  vagaNumero: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  vagaInfo: {
    marginTop: theme.spacing.xs,
  },
  vagaPlaca: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  vagaTimer: {
    fontSize: 12,
    color: theme.colors.text,
    opacity: 0.7,
  },
  vagaModal: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    ...theme.shadows.large,
  },
  vagaModalTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontSize: 24,
    fontWeight: '700',
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
    borderColor: theme.colors.primary,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: theme.spacing.xs,
  },
  vagaInfoCard: {
    marginBottom: theme.spacing.lg,
    ...theme.shadows.small,
  },
  vagaInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  vagaInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    opacity: 0.7,
  },
  vagaInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  vagaModalButton: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.roundness - 2,
  },
  modalSubtitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.text,
    opacity: 0.7,
  },
  tempoOption: {
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.roundness - 2,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  tempoOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
}); 