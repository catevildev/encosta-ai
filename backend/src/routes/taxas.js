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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gatossauro');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

// Cadastrar nova taxa
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { tipo, valor, periodo } = req.body;
    const empresaId = req.user.tipo === 'admin' ? req.body.empresa_id : req.user.id;

    const [result] = await pool.query(
      'INSERT INTO taxas (empresa_id, tipo, valor, periodo) VALUES (?, ?, ?, ?)',
      [empresaId, tipo, valor, periodo]
    );

    res.status(201).json({ id: result.insertId, tipo, valor, periodo });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao cadastrar taxa' });
  }
});

// Listar taxas
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = 'SELECT t.*, e.nome as empresa_nome FROM taxas t JOIN empresas e ON t.empresa_id = e.id';
    let params = [];

    if (req.user.tipo !== 'admin') {
      query += ' WHERE t.empresa_id = ?';
      params.push(req.user.id);
    }

    const [taxas] = await pool.query(query, params);
    res.json(taxas);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar taxas' });
  }
});

// Atualizar taxa
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { tipo, valor, periodo } = req.body;
    const taxaId = req.params.id;

    // Verificar se a taxa pertence à empresa
    const [taxas] = await pool.query(
      'SELECT empresa_id FROM taxas WHERE id = ?',
      [taxaId]
    );

    if (taxas.length === 0) {
      return res.status(404).json({ message: 'Taxa não encontrada' });
    }

    if (req.user.tipo !== 'admin' && taxas[0].empresa_id !== req.user.id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    await pool.query(
      'UPDATE taxas SET tipo = ?, valor = ?, periodo = ? WHERE id = ?',
      [tipo, valor, periodo, taxaId]
    );

    res.json({ message: 'Taxa atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar taxa' });
  }
});

// Deletar taxa
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const taxaId = req.params.id;

    // Verificar se a taxa pertence à empresa
    const [taxas] = await pool.query(
      'SELECT empresa_id FROM taxas WHERE id = ?',
      [taxaId]
    );

    if (taxas.length === 0) {
      return res.status(404).json({ message: 'Taxa não encontrada' });
    }

    if (req.user.tipo !== 'admin' && taxas[0].empresa_id !== req.user.id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    await pool.query('DELETE FROM taxas WHERE id = ?', [taxaId]);
    res.json({ message: 'Taxa deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar taxa' });
  }
});

module.exports = router; 