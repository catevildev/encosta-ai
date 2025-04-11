import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, Title, Paragraph, FAB, Portal, Modal, TextInput, DataTable, Text } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { theme } from '../../theme';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../../config/api';

export default function EmpresaDashboard({ navigation }) {
  const { user, signOut } = useAuth();
  const [veiculos, setVeiculos] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    placa: '',
    modelo: '',
    cor: '',
    tipo: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setError('');
      const [veiculosResponse, registrosResponse] = await Promise.all([
        axios.get(`${api.baseURL}/api/veiculos`),
        axios.get(`${api.baseURL}/api/registros`),
      ]);
      setVeiculos(veiculosResponse.data);
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
        tipo: '',
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

  async function handleRegistro(veiculoId, tipo) {
    try {
      setError('');
      await axios.post(`${api.baseURL}/api/registros`, {
        veiculo_id: veiculoId,
        tipo,
      });
      loadData();
    } catch (error) {
      console.error('Erro ao registrar entrada/saída:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Erro ao registrar entrada/saída. Tente novamente.');
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

  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Title>Bem-vindo, {user?.nome || ''}!</Title>
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
              <Title style={styles.sectionTitle}>Veículos Cadastrados</Title>
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
                veiculos.map((veiculo) => (
                  <Card key={veiculo.id} style={styles.card}>
                    <Card.Content>
                      <Title>{veiculo.placa}</Title>
                      <Paragraph>Modelo: {veiculo.modelo}</Paragraph>
                      <Paragraph>Cor: {veiculo.cor}</Paragraph>
                      <Paragraph>Tipo: {veiculo.tipo}</Paragraph>
                      <View style={styles.buttonContainer}>
                        <Button
                          mode="contained"
                          onPress={() => handleRegistro(veiculo.id, 'entrada')}
                          style={[styles.button, { backgroundColor: theme.colors.success }]}
                        >
                          Entrada
                        </Button>
                        <Button
                          mode="contained"
                          onPress={() => handleRegistro(veiculo.id, 'saida')}
                          style={[styles.button, { backgroundColor: theme.colors.error }]}
                        >
                          Saída
                        </Button>
                      </View>
                    </Card.Content>
                  </Card>
                ))
              )}
            </View>

            <View style={styles.section}>
              <Title style={styles.sectionTitle}>Últimos Registros</Title>
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
                        {registro.valor ? `R$ ${registro.valor.toFixed(2)}` : '-'}
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
          <Title style={styles.modalTitle}>Cadastrar Novo Veículo</Title>
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
            onChangeText={(text) => setFormData({ ...formData, tipo: text })}
            mode="outlined"
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            style={styles.button}
          >
            Cadastrar
          </Button>
        </Modal>
      </Portal>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setVisible(true)}
      />

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
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
    elevation: 4,
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
}); 