import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Clipboard } from 'react-native';
import { Button, Card, Title, Paragraph, FAB, Portal, Modal, TextInput, Text, IconButton } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { theme } from '../../theme';
import { api } from '../../config/api';

export default function AdminDashboard({ navigation }) {
  const { user, signOut } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    senha: '',
    telefone: '',
    endereco: '',
  });
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');

  useEffect(() => {
    loadEmpresas();
  }, []);

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

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      await axios.post(`${api.baseURL}/api/empresas`, formData);
      setVisible(false);
      loadEmpresas();
      setFormData({
        nome: '',
        cnpj: '',
        email: '',
        senha: '',
        telefone: '',
        endereco: '',
      });
    } catch (error) {
      console.error('Erro ao cadastrar empresa:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Erro ao cadastrar empresa. Tente novamente.');
      }
    } finally {
      setLoading(false);
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
      <ScrollView>
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Title>Bem-vindo, {user?.nome || ''}!</Title>
            <Paragraph>Gerencie suas empresas de estacionamento</Paragraph>
          </Card.Content>
        </Card>

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
              <Card.Content>
                <Text style={styles.emptyText}>
                  Nenhuma empresa cadastrada ainda.
                  {'\n'}Clique no botão + para adicionar uma nova empresa.
                </Text>
              </Card.Content>
            </Card>
          ) : (
            empresas.map((empresa) => (
              <Card key={empresa.id} style={styles.empresaCard}>
                <Card.Content>
                  <View style={styles.empresaHeader}>
                    <Title>{empresa.nome}</Title>
                    <IconButton
                      icon="key"
                      size={24}
                      onPress={() => handleResetPassword(empresa.id)}
                    />
                  </View>
                  <Paragraph>CNPJ: {empresa.cnpj}</Paragraph>
                  <Paragraph>Email: {empresa.email}</Paragraph>
                  <Paragraph>Telefone: {empresa.telefone}</Paragraph>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Title style={styles.modalTitle}>Cadastrar Nova Empresa</Title>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <TextInput
            label="Nome"
            value={formData.nome}
            onChangeText={(text) => setFormData({ ...formData, nome: text })}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="CNPJ"
            value={formData.cnpj}
            onChangeText={(text) => setFormData({ ...formData, cnpj: text })}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
          />
          <TextInput
            label="Senha"
            value={formData.senha}
            onChangeText={(text) => setFormData({ ...formData, senha: text })}
            mode="outlined"
            style={styles.input}
            secureTextEntry
          />
          <TextInput
            label="Telefone"
            value={formData.telefone}
            onChangeText={(text) => setFormData({ ...formData, telefone: text })}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Endereço"
            value={formData.endereco}
            onChangeText={(text) => setFormData({ ...formData, endereco: text })}
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
  empresasContainer: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  empresaCard: {
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
  button: {
    marginTop: 10,
  },
  logoutButton: {
    margin: 16,
    marginTop: 'auto',
  },
  empresaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  novaSenhaText: {
    fontSize: 24,
    textAlign: 'center',
    marginVertical: 20,
    fontFamily: 'monospace',
  },
  copiedText: {
    textAlign: 'center',
    color: theme.colors.success,
    marginBottom: 20,
  },
}); 