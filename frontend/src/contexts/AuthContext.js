import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { api } from '../config/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  async function loadStoredData() {
    try {
      const storedUser = await AsyncStorage.getItem('@EstacionaAI:user');
      const storedToken = await AsyncStorage.getItem('@EstacionaAI:token');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    } catch (error) {
      console.error('Erro ao carregar dados armazenados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email, senha, tipo) {
    try {
      const response = await axios.post(`${api.baseURL}/api/auth/${tipo}/login`, {
        email,
        senha,
      });

      const { token } = response.data;
      const userData = response.data[tipo]; // admin ou empresa

      if (!userData || !token) {
        throw new Error('Resposta inválida do servidor');
      }

      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      await AsyncStorage.setItem('@EstacionaAI:user', JSON.stringify(userData));
      await AsyncStorage.setItem('@EstacionaAI:token', token);

      return userData;
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Erro ao fazer login. Tente novamente.');
    }
  }

  async function signOut() {
    try {
      await AsyncStorage.removeItem('@EstacionaAI:user');
      await AsyncStorage.removeItem('@EstacionaAI:token');
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        signed: !!user,
        user,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
} 