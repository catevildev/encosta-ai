import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Clipboard } from 'react-native';
import { Button, Card, Title, Paragraph, FAB, Portal, Modal, TextInput, Text, DataTable, IconButton, Menu, RadioButton, List } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { theme } from '../../theme';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../../config/api';
import { User, Car, List as ListIcon, LogOut, Plus, SquareParking, ArrowDownRight, ArrowUpRight } from 'lucide-react-native';
import Feather from 'react-native-vector-icons/Feather';

export default function EmpresaDashboard({ navigation }) {
  const { user, signOut } = useAuth();
  const [veiculos, setVeiculos] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [configValores, setConfigValores] = useState([]);
  const [visible, setVisible] = useState(false);
  const [configModal, setConfigModal] = useState(false);
  const [saidaModal, setSaidaModal] = useState(false);
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
  const [novaConfig, setNovaConfig] = useState({
    tipo_veiculo: 'carro',
    valor_hora: '',
    valor_fracao: ''
  });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadData();
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      setError('');
      const [veiculosResponse, registrosResponse, configResponse] = await Promise.all([
        axios.get(`${api.baseURL}/api/veiculos`),
        axios.get(`${api.baseURL}/api/registros`),
        axios.get(`${api.baseURL}/api/config_valores`),
      ]);
      setVeiculos(veiculosResponse.data);
      setRegistros(registrosResponse.data);
      setConfigValores(configResponse.data);
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

  async function handleEntrada(veiculo) {
    try {
      setError('');
      await axios.post(`${api.baseURL}/api/registros/entrada`, {
        placa: veiculo.placa,
        tipo: veiculo.tipo
      });
      loadData();
    } catch (error) {
      console.error('Erro ao registrar entrada:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
        alert(error.response.data.error);
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

  async function handleConfigValores() {
    try {
      setError('');
      const response = await axios.get(`${api.baseURL}/api/config_valores`);
      setConfigValores(response.data);
      setConfigModal(true);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setError('Erro ao carregar configurações. Tente novamente.');
    }
  }

  async function handleUpdateConfig(config) {
    try {
      setError('');
      await axios.put(`${api.baseURL}/api/config_valores/${config.id}`, {
        valor_hora: config.valor_hora,
        valor_fracao: config.valor_fracao,
      });
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      setError('Erro ao atualizar configuração. Tente novamente.');
    }
  }

  async function handleCreateConfig() {
    try {
      setError('');
      await axios.post(`${api.baseURL}/api/config_valores`, {
        tipo_veiculo: novaConfig.tipo_veiculo,
        valor_hora: parseFloat(novaConfig.valor_hora) || 0,
        valor_fracao: parseFloat(novaConfig.valor_fracao) || 0
      });
      setNovaConfig({
        tipo_veiculo: 'carro',
        valor_hora: '',
        valor_fracao: ''
      });
      loadData();
    } catch (error) {
      console.error('Erro ao criar configuração:', error);
      setError('Erro ao criar configuração. Tente novamente.');
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

  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.welcomeCard} theme={{ roundness: 0 }}>
          <Card.Content>
            <View style={styles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <SquareParking size={22} color={theme.colors.text} style={{ marginRight: 6 }} />
                <Title>Bem-vindo, {user?.nome || ''}!</Title>
              </View>
              <IconButton
                icon="cog"
                size={24}
                onPress={handleConfigValores}
              />
            </View>
            <Paragraph>Gerencie seu estacionamento</Paragraph>
          </Card.Content>
        </Card>

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
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Car size={20} color={theme.colors.text} style={{ marginRight: 6}} />
                <Title style={[styles.sectionTitle, { marginBottom: 0 }]}>Veículos Cadastrados</Title>
              </View>
              {veiculos.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <Card.Content>
                    <Text style={styles.emptyText}>
                      Nenhum veículo cadastrado ainda.
                      {'\n'}Clique no botão + para adicionar um novo veículo.
                    </Text>
                  </Card.Content>
                </Card>
              ) : (
                veiculos.map((veiculo) => {
                  // Usar o campo created_at do veículo para o timer
                  let timer = '';
                  if (veiculo.created_at) {
                    const diffMs = now - new Date(veiculo.created_at).getTime();
                    const diffH = Math.floor(diffMs / 3600000);
                    const diffM = Math.floor((diffMs % 3600000) / 60000);
                    const diffS = Math.floor((diffMs % 60000) / 1000);
                    timer = `${diffH}h ${diffM}m ${diffS}s`;
                  }
                  return (
                    <Card key={veiculo.id} style={styles.card}>
                      <Card.Content>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Title>{veiculo.placa}</Title>
                          {timer && (
                            <View style={{ backgroundColor: '#eee', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                              <Text style={{ fontWeight: 'bold', color: '#333', fontSize: 13 }}>{timer}</Text>
                            </View>
                          )}
                        </View>
                        <Paragraph>Modelo: {veiculo.modelo}</Paragraph>
                        <Paragraph>Cor: {veiculo.cor}</Paragraph>
                        <Paragraph>Tipo: {veiculo.tipo}</Paragraph>
                        <View style={styles.buttonContainer}>
                          <Button
                            mode="contained"
                            onPress={() => handleEntrada(veiculo)}
                            style={[styles.button, { backgroundColor: theme.colors.success }]}
                            contentStyle={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                            labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                            icon={({ size, color }) => <Feather name="arrow-down-circle" size={18} color="#fff" />}
                          >
                            Entrada
                          </Button>
                          <Button
                            mode="contained"
                            onPress={() => handleSaida(veiculo)}
                            style={[styles.button, { backgroundColor: theme.colors.error }]}
                            contentStyle={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                            labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                            icon={({ size, color }) => <Feather name="arrow-up-circle" size={18} color="#fff" />}
                          >
                            Saída
                          </Button>
                        </View>
                      </Card.Content>
                    </Card>
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
          visible={configModal}
          onDismiss={() => setConfigModal(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => setConfigModal(false)}
            />
            <Title style={[styles.modalTitle, { marginBottom: 0 }]}>Configurar Valores</Title>
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
          
          <View style={styles.configItem}>            
            <List.Item
              title="Tipo de Veículo"
              description={novaConfig.tipo_veiculo === 'carro' ? 'Carro' : 
                          novaConfig.tipo_veiculo === 'moto' ? 'Moto' : 'Caminhão'}
              right={props => <List.Icon {...props} icon="chevron-down" />}
              onPress={() => setShowPicker(true)}
              style={styles.pickerButton}
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
                    setNovaConfig({ ...novaConfig, tipo_veiculo: 'carro' });
                    setShowPicker(false);
                  }}
                />
                <List.Item
                  title="Moto"
                  onPress={() => {
                    setNovaConfig({ ...novaConfig, tipo_veiculo: 'moto' });
                    setShowPicker(false);
                  }}
                />
                <List.Item
                  title="Caminhão"
                  onPress={() => {
                    setNovaConfig({ ...novaConfig, tipo_veiculo: 'caminhao' });
                    setShowPicker(false);
                  }}
                />
              </Modal>
            </Portal>

            <TextInput
              label="Valor por Hora (R$)"
              value={novaConfig.valor_hora}
              onChangeText={text => setNovaConfig({ ...novaConfig, valor_hora: text })}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              label="Valor por Fração (15min) (R$)"
              value={novaConfig.valor_fracao}
              onChangeText={text => setNovaConfig({ ...novaConfig, valor_fracao: text })}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
            <Button
              mode="contained"
              onPress={handleCreateConfig}
              style={styles.button}
            >
              Adicionar Configuração
            </Button>
          </View>

          {configValores.length > 0 && (
            <View style={styles.configList}>
              <Title style={styles.configTitle}>Configurações Existentes</Title>
              {configValores.map((config) => (
                <View key={config.id} style={styles.configItem}>
                  <Title style={styles.configTitle}>
                    {config.tipo_veiculo === 'carro' ? 'Carro' : 
                     config.tipo_veiculo === 'moto' ? 'Moto' : 'Caminhão'}
                  </Title>
                  <TextInput
                    label="Valor por Hora (R$)"
                    value={config.valor_hora.toString()}
                    onChangeText={(text) => {
                      const newConfigs = [...configValores];
                      const index = newConfigs.findIndex(c => c.id === config.id);
                      newConfigs[index].valor_hora = parseFloat(text) || 0;
                      setConfigValores(newConfigs);
                    }}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                  <TextInput
                    label="Valor por Fração (15min) (R$)"
                    value={config.valor_fracao.toString()}
                    onChangeText={(text) => {
                      const newConfigs = [...configValores];
                      const index = newConfigs.findIndex(c => c.id === config.id);
                      newConfigs[index].valor_fracao = parseFloat(text) || 0;
                      setConfigValores(newConfigs);
                    }}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                  <Button
                    mode="contained"
                    onPress={() => handleUpdateConfig(config)}
                    style={styles.button}
                  >
                    Atualizar
                  </Button>
                </View>
              ))}
            </View>
          )}
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
      </Portal>

      <FAB
        style={styles.fab}
        icon={({ size, color }) => <Plus size={size} color={color} />}
        onPress={() => setVisible(true)}
      />

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
        contentStyle={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
      >
        Sair
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  welcomeCard: {
    margin: 16,
    borderRadius: 0,
    borderWidth: 0,
    shadowColor: 'transparent',
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  emptyCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: theme.colors.surface,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
  },
  errorCard: {
    margin: 16,
    elevation: 2,
    backgroundColor: theme.colors.error + '10',
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
    justifyContent: 'space-around',
    marginTop: 10,
  },
  button: {
    marginHorizontal: 5,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 60,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  logoutButton: {
    margin: 16,
    marginTop: 'auto',
  },
  configItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  configTitle: {
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  saidaText: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  pickerButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
    marginBottom: 15,
  },
  pickerModal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
  },
  configList: {
    marginTop: 20,
  },
}); 