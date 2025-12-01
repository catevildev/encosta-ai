const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * components:
 *   schemas:
 *     ConfigValor:
 *       type: object
 *       required:
 *         - tipo_veiculo
 *         - valor_hora
 *         - valor_fracao
 *       properties:
 *         id:
 *           type: integer
 *           description: ID da configuração
 *         tipo_veiculo:
 *           type: string
 *           enum: [carro, moto, caminhao]
 *           description: Tipo do veículo
 *         valor_hora:
 *           type: number
 *           format: float
 *           description: Valor por hora
 *         valor_fracao:
 *           type: number
 *           format: float
 *           description: Valor por fração (15 minutos)
 *         empresa_id:
 *           type: integer
 *           description: ID da empresa
 */

// Middleware de autenticação
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_this_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

/**
 * @swagger
 * /api/config_valores:
 *   get:
 *     summary: Listar configurações de valores
 *     tags: [Configurações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de configurações
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ConfigValor'
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro ao listar configurações
 */
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

/**
 * @swagger
 * /api/config_valores/{id}:
 *   put:
 *     summary: Atualizar configuração de valores
 *     tags: [Configurações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da configuração
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               valor_hora:
 *                 type: number
 *                 format: float
 *               valor_fracao:
 *                 type: number
 *                 format: float
 *     responses:
 *       200:
 *         description: Configuração atualizada com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Configuração não encontrada
 *       500:
 *         description: Erro ao atualizar configuração
 */
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

/**
 * @swagger
 * /api/config_valores:
 *   post:
 *     summary: Criar nova configuração de valores
 *     tags: [Configurações]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo_veiculo
 *               - valor_hora
 *               - valor_fracao
 *             properties:
 *               tipo_veiculo:
 *                 type: string
 *                 enum: [carro, moto, caminhao]
 *               valor_hora:
 *                 type: number
 *                 format: float
 *               valor_fracao:
 *                 type: number
 *                 format: float
 *     responses:
 *       201:
 *         description: Configuração criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *       400:
 *         description: Já existe uma configuração para este tipo de veículo
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro ao criar configuração
 */
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