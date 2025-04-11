const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const jwt = require('jsonwebtoken');

// Middleware de autenticação
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

// Cadastrar novo veículo
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { placa, modelo, cor, tipo } = req.body;
    const empresaId = req.user.tipo === 'admin' ? req.body.empresa_id : req.user.id;

    const [result] = await pool.query(
      'INSERT INTO veiculos (empresa_id, placa, modelo, cor, tipo) VALUES (?, ?, ?, ?, ?)',
      [empresaId, placa, modelo, cor, tipo]
    );

    res.status(201).json({ id: result.insertId, placa, modelo, cor, tipo });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao cadastrar veículo' });
  }
});

// Listar veículos
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = 'SELECT v.*, e.nome as empresa_nome FROM veiculos v JOIN empresas e ON v.empresa_id = e.id';
    let params = [];

    if (req.user.tipo !== 'admin') {
      query += ' WHERE v.empresa_id = ?';
      params.push(req.user.id);
    }

    const [veiculos] = await pool.query(query, params);
    res.json(veiculos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar veículos' });
  }
});

// Obter detalhes de um veículo
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [veiculos] = await pool.query(
      'SELECT v.*, e.nome as empresa_nome FROM veiculos v JOIN empresas e ON v.empresa_id = e.id WHERE v.id = ?',
      [req.params.id]
    );

    if (veiculos.length === 0) {
      return res.status(404).json({ message: 'Veículo não encontrado' });
    }

    // Verificar se o usuário tem acesso a este veículo
    if (req.user.tipo !== 'admin' && veiculos[0].empresa_id !== req.user.id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json(veiculos[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter detalhes do veículo' });
  }
});

// Atualizar veículo
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { modelo, cor, tipo } = req.body;
    const veiculoId = req.params.id;

    // Verificar se o veículo pertence à empresa
    const [veiculos] = await pool.query(
      'SELECT empresa_id FROM veiculos WHERE id = ?',
      [veiculoId]
    );

    if (veiculos.length === 0) {
      return res.status(404).json({ message: 'Veículo não encontrado' });
    }

    if (req.user.tipo !== 'admin' && veiculos[0].empresa_id !== req.user.id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    await pool.query(
      'UPDATE veiculos SET modelo = ?, cor = ?, tipo = ? WHERE id = ?',
      [modelo, cor, tipo, veiculoId]
    );

    res.json({ message: 'Veículo atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar veículo' });
  }
});

// Deletar veículo
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const veiculoId = req.params.id;

    // Verificar se o veículo pertence à empresa
    const [veiculos] = await pool.query(
      'SELECT empresa_id FROM veiculos WHERE id = ?',
      [veiculoId]
    );

    if (veiculos.length === 0) {
      return res.status(404).json({ message: 'Veículo não encontrado' });
    }

    if (req.user.tipo !== 'admin' && veiculos[0].empresa_id !== req.user.id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    await pool.query('DELETE FROM veiculos WHERE id = ?', [veiculoId]);
    res.json({ message: 'Veículo deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar veículo' });
  }
});

module.exports = router; 