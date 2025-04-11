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

// Registrar entrada ou saída
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { veiculo_id, tipo } = req.body;
    const empresaId = req.user.tipo === 'admin' ? req.body.empresa_id : req.user.id;

    // Verificar se o veículo pertence à empresa
    const [veiculos] = await pool.query(
      'SELECT * FROM veiculos WHERE id = ? AND empresa_id = ?',
      [veiculo_id, empresaId]
    );

    if (veiculos.length === 0) {
      return res.status(404).json({ message: 'Veículo não encontrado' });
    }

    // Calcular valor se for saída
    let valor = null;
    if (tipo === 'saida') {
      // Buscar último registro de entrada
      const [ultimaEntrada] = await pool.query(
        'SELECT data_hora FROM registros WHERE veiculo_id = ? AND tipo = "entrada" ORDER BY data_hora DESC LIMIT 1',
        [veiculo_id]
      );

      if (ultimaEntrada.length > 0) {
        // Buscar taxa da empresa
        const [taxas] = await pool.query(
          'SELECT * FROM taxas WHERE empresa_id = ? ORDER BY valor DESC LIMIT 1',
          [empresaId]
        );

        if (taxas.length > 0) {
          const tempoEstacionado = (new Date() - new Date(ultimaEntrada[0].data_hora)) / (1000 * 60 * 60); // em horas
          valor = tempoEstacionado * taxas[0].valor;
        }
      }
    }

    const [result] = await pool.query(
      'INSERT INTO registros (veiculo_id, tipo, valor) VALUES (?, ?, ?)',
      [veiculo_id, tipo, valor]
    );

    res.status(201).json({ id: result.insertId, tipo, valor });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registrar entrada/saída' });
  }
});

// Listar registros
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = `
      SELECT r.*, v.placa, v.modelo, e.nome as empresa_nome 
      FROM registros r 
      JOIN veiculos v ON r.veiculo_id = v.id 
      JOIN empresas e ON v.empresa_id = e.id
    `;
    let params = [];

    if (req.user.tipo !== 'admin') {
      query += ' WHERE v.empresa_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY r.data_hora DESC';

    const [registros] = await pool.query(query, params);
    res.json(registros);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar registros' });
  }
});

// Obter relatório por período
router.get('/relatorio', authMiddleware, async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    let query = `
      SELECT 
        r.tipo,
        COUNT(*) as quantidade,
        SUM(r.valor) as valor_total,
        v.placa,
        v.modelo,
        e.nome as empresa_nome
      FROM registros r 
      JOIN veiculos v ON r.veiculo_id = v.id 
      JOIN empresas e ON v.empresa_id = e.id
      WHERE r.data_hora BETWEEN ? AND ?
    `;
    let params = [data_inicio, data_fim];

    if (req.user.tipo !== 'admin') {
      query += ' AND v.empresa_id = ?';
      params.push(req.user.id);
    }

    query += ' GROUP BY r.tipo, v.placa, v.modelo, e.nome ORDER BY r.data_hora DESC';

    const [relatorio] = await pool.query(query, params);
    res.json(relatorio);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao gerar relatório' });
  }
});

module.exports = router; 