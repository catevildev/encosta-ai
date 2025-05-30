const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const jwt = require('jsonwebtoken');

// Middleware para verificar se é admin
const adminMiddleware = (req, res, next) => {
  if (req.user.tipo !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado' });
  }
  next();
};

// Middleware de autenticação
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gatossauro');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

// Cadastrar nova empresa (apenas admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { nome, cnpj, email, senha, telefone, endereco } = req.body;
    const senhaHash = await bcrypt.hash(senha, 10);

    const [result] = await pool.query(
      'INSERT INTO empresas (nome, cnpj, email, senha, telefone, endereco) VALUES (?, ?, ?, ?, ?, ?)',
      [nome, cnpj, email, senhaHash, telefone, endereco]
    );

    res.status(201).json({ id: result.insertId, nome, email, cnpj });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email ou CNPJ já cadastrado' });
    }
    res.status(500).json({ message: 'Erro ao cadastrar empresa' });
  }
});

// Listar todas as empresas (apenas admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [empresas] = await pool.query('SELECT id, nome, cnpj, email, telefone, endereco, created_at FROM empresas');
    res.json(empresas);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar empresas' });
  }
});

// Obter detalhes de uma empresa
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [empresas] = await pool.query(
      'SELECT id, nome, cnpj, email, telefone, endereco, created_at FROM empresas WHERE id = ?',
      [req.params.id]
    );

    if (empresas.length === 0) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    res.json(empresas[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter detalhes da empresa' });
  }
});

// Atualizar empresa
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { nome, telefone, endereco } = req.body;
    const empresaId = req.params.id;

    // Verificar se é admin ou a própria empresa
    if (req.user.tipo !== 'admin' && req.user.id !== parseInt(empresaId)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    await pool.query(
      'UPDATE empresas SET nome = ?, telefone = ?, endereco = ? WHERE id = ?',
      [nome, telefone, endereco, empresaId]
    );

    res.json({ message: 'Empresa atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar empresa' });
  }
});

// Deletar empresa (apenas admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM empresas WHERE id = ?', [req.params.id]);
    res.json({ message: 'Empresa deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar empresa' });
  }
});

// Resetar senha de uma empresa (apenas admin)
router.post('/:id/reset-password', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const empresaId = req.params.id;
    const novaSenha = Math.random().toString(36).slice(-8); // Gera uma senha aleatória de 8 caracteres
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    await pool.query(
      'UPDATE empresas SET senha = ? WHERE id = ?',
      [senhaHash, empresaId]
    );

    res.json({ novaSenha });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao resetar senha' });
  }
});

module.exports = router; 