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

// Listar configurações
router.get('/', authMiddleware, async (req, res) => {
  try {
    const empresaId = req.user.tipo === 'admin' ? req.query.empresa_id : req.user.id;
    const [configs] = await pool.query(
      'SELECT * FROM config_valores WHERE empresa_id = ?',
      [empresaId]
    );
    res.json(configs);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar configurações' });
  }
});

// Atualizar configuração
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { valor_hora, valor_fracao } = req.body;
    const configId = req.params.id;
    const empresaId = req.user.tipo === 'admin' ? req.body.empresa_id : req.user.id;

    // Verificar se a configuração pertence à empresa
    const [configs] = await pool.query(
      'SELECT * FROM config_valores WHERE id = ? AND empresa_id = ?',
      [configId, empresaId]
    );

    if (configs.length === 0) {
      return res.status(404).json({ message: 'Configuração não encontrada' });
    }

    await pool.query(
      'UPDATE config_valores SET valor_hora = ?, valor_fracao = ? WHERE id = ?',
      [valor_hora, valor_fracao, configId]
    );

    res.json({ message: 'Configuração atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar configuração' });
  }
});

// Criar configuração
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { tipo_veiculo, valor_hora, valor_fracao } = req.body;
    const empresaId = req.user.tipo === 'admin' ? req.body.empresa_id : req.user.id;

    const [result] = await pool.query(
      'INSERT INTO config_valores (empresa_id, tipo_veiculo, valor_hora, valor_fracao) VALUES (?, ?, ?, ?)',
      [empresaId, tipo_veiculo, valor_hora, valor_fracao]
    );

    res.status(201).json({ id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Já existe uma configuração para este tipo de veículo' });
    }
    res.status(500).json({ message: 'Erro ao criar configuração' });
  }
});

module.exports = router; 