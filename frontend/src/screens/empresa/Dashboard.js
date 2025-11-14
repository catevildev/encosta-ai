import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Clipboard, Animated, TouchableOpacity, Text as RNText, Alert } from 'react-native';
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
  const [veiculosEstacionados, setVeiculosEstacionados] = useState([]);
  const [veiculosCadastrados, setVeiculosCadastrados] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [visible, setVisible] = useState(false);
  const [veiculosModal, setVeiculosModal] = useState(false);
  const [saidaModal, setSaidaModal] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerMode, setScannerMode] = useState('entrada');
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadData();
    const interval = setInterval(() => setNow(Date.now()), 1000);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      setError('');
      const [veiculosEstacionadosResponse, veiculosCadastradosResponse, registrosResponse] = await Promise.all([
        axios.get(`${api.baseURL}/api/veiculos/estacionados`),
        axios.get(`${api.baseURL}/api/veiculos`),
        axios.get(`${api.baseURL}/api/registros`),
      ]);
      setVeiculosEstacionados(veiculosEstacionadosResponse.data);
      setVeiculosCadastrados(veiculosCadastradosResponse.data);
      setRegistros(registrosResponse.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      if (error.message === 'Network Error') {
        setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      } else {
        setError('Erro ao carregar dados. Tente novamente mais tarde.');
      }
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

  async function handleEntrada(placa) {
    try {
      setError('');
      // Buscar veículo cadastrado pela placa
      const veiculo = veiculosCadastrados.find(v => v.placa === placa);
      if (!veiculo) {
        alert('Veículo não encontrado. Por favor, cadastre o veículo primeiro.');
        return;
      }
      
      await axios.post(`${api.baseURL}/api/registros/entrada`, {
        placa: veiculo.placa,
        tipo: veiculo.tipo
      });
      loadData();
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
        <Animated.View
          style={[
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
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
                  <View>
                    <Title style={styles.welcomeTitle}>Bem-vindo, {user?.nome || ''}!</Title>
                    <Paragraph style={styles.welcomeSubtitle}>Gerencie seu estacionamento</Paragraph>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleConfigValores}
                  style={styles.settingsButton}
                >
                  <IconButton
                    icon="cog"
                    size={24}
                    iconColor="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </Card.Content>
          </LinearGradient>
        </Animated.View>

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
                  <Car size={20} color={theme.colors.text} style={{ marginRight: 6}} />
                  <Title style={[styles.sectionTitle, { marginBottom: 0 }]}>Veículos Estacionados</Title>
                </View>
                <TouchableOpacity
                  onPress={() => setVeiculosModal(true)}
                  style={styles.manageButton}
                >
                  <Text style={styles.manageButtonText}>Gerenciar</Text>
                </TouchableOpacity>
              </View>
              {veiculosEstacionados.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <Card.Content>
                    <Text style={styles.emptyText}>
                      Nenhum veículo estacionado no momento.
                    </Text>
                    <Text style={styles.emptySubtext}>
                      Registre uma entrada para começar.
                    </Text>
                  </Card.Content>
                </Card>
              ) : (
                veiculosEstacionados.map((veiculo, index) => {
                  // Calcular timer baseado na data_entrada
                  let timer = '';
                  if (veiculo.data_entrada) {
                    const diffMs = now - new Date(veiculo.data_entrada).getTime();
                    const diffH = Math.floor(diffMs / 3600000);
                    const diffM = Math.floor((diffMs % 3600000) / 60000);
                    const diffS = Math.floor((diffMs % 60000) / 1000);
                    timer = `${diffH}h ${diffM}m ${diffS}s`;
                  }
                  return (
                    <Animated.View
                      key={veiculo.id}
                      style={[
                        {
                          opacity: fadeAnim,
                          transform: [
                            {
                              translateY: slideAnim.interpolate({
                                inputRange: [0, 30],
                                outputRange: [0, 30 + index * 10],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <Card style={styles.card}>
                        <Card.Content>
                          <View style={styles.veiculoHeader}>
                            <View style={styles.veiculoInfo}>
                              <View style={styles.veiculoIcon}>
                                <Car size={24} color={theme.colors.primary} />
                              </View>
                              <View>
                                <Title style={styles.veiculoPlaca}>{veiculo.placa}</Title>
                                <Text style={styles.veiculoTipo}>{veiculo.tipo}</Text>
                              </View>
                            </View>
                            {timer && (
                              <View style={styles.timerBadge}>
                                <Text style={styles.timerText}>{timer}</Text>
                              </View>
                            )}
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
                          <View style={styles.buttonContainer}>
                            <TouchableOpacity
                              onPress={() => handleSaida(veiculo)}
                              style={[styles.actionButton, styles.saidaButton, { flex: 1 }]}
                            >
                              <Feather name="arrow-up-circle" size={20} color="#FFFFFF" />
                              <Text style={styles.actionButtonText}>Registrar Saída</Text>
                            </TouchableOpacity>
                          </View>
                        </Card.Content>
                      </Card>
                    </Animated.View>
                  );
                })
              )}
            </View>

            <View style={styles.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <ListIcon size={20} color={theme.colors.text} style={{ marginRight: 6, marginTop: 2 }} />
                <Title style={[styles.sectionTitle, { marginBottom: 0 }]}>Últimos Registros</Title>
              </View>
              {registros.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <Card.Content>
                    <Text style={styles.emptyText}>
                      Nenhum registro encontrado.
                    </Text>
                  </Card.Content>
                </Card>
              ) : (
                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title>Veículo</DataTable.Title>
                    <DataTable.Title>Tipo</DataTable.Title>
                    <DataTable.Title>Data/Hora</DataTable.Title>
                    <DataTable.Title numeric>Valor</DataTable.Title>
                  </DataTable.Header>

                  {registros.slice(0, 5).map((registro) => (
                    <DataTable.Row key={registro.id}>
                      <DataTable.Cell>{registro.placa}</DataTable.Cell>
                      <DataTable.Cell>{registro.tipo}</DataTable.Cell>
                      <DataTable.Cell>
                        {format(new Date(registro.data_hora), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        {registro.valor !== undefined && registro.valor !== null && !isNaN(Number(registro.valor))
                          ? `R$ ${Number(registro.valor).toFixed(2)}`
                          : '-'}
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>
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
                      onPress={() => {
                        handleEntrada(veiculo.placa);
                        setVeiculosModal(false);
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

      <TouchableOpacity
        onPress={handleLogout}
        style={styles.logoutButton}
        activeOpacity={0.7}
      >
        <RNText style={styles.logoutText}>Sair</RNText>
      </TouchableOpacity>

      <PlacaScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onPlacaDetected={async (placa) => {
          // Verificar se veículo existe
          const veiculo = veiculosCadastrados.find(v => v.placa === placa);
          if (veiculo) {
            if (scannerMode === 'entrada') {
              await handleEntrada(placa);
            } else {
              // Para saída, precisamos encontrar o veículo estacionado
              const veiculoEstacionado = veiculosEstacionados.find(v => v.placa === placa);
              if (veiculoEstacionado) {
                handleSaida(veiculoEstacionado);
              } else {
                alert('Este veículo não está estacionado no momento.');
              }
            }
          } else {
            // Veículo não cadastrado - perguntar se quer cadastrar
            Alert.alert(
              'Veículo não encontrado',
              `A placa ${placa} não está cadastrada. Deseja cadastrar agora?`,
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Cadastrar',
                  onPress: () => {
                    setFormData({ ...formData, placa });
                    setVisible(true);
                  }
                }
              ]
            );
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  settingsButton: {
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
}); 