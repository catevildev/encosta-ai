const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * components:
 *   schemas:
 *     Veiculo:
 *       type: object
 *       required:
 *         - placa
 *         - modelo
 *         - cor
 *         - tipo
 *       properties:
 *         id:
 *           type: integer
 *           description: ID do veículo
 *         placa:
 *           type: string
 *           description: Placa do veículo
 *         modelo:
 *           type: string
 *           description: Modelo do veículo
 *         cor:
 *           type: string
 *           description: Cor do veículo
 *         tipo:
 *           type: string
 *           enum: [carro, moto, caminhao]
 *           description: Tipo do veículo
 *         empresa_id:
 *           type: integer
 *           description: ID da empresa proprietária
 */

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

/**
 * @swagger
 * /api/veiculos:
 *   post:
 *     summary: Cadastrar novo veículo
 *     tags: [Veículos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Veiculo'
 *     responses:
 *       201:
 *         description: Veículo cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Veiculo'
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro ao cadastrar veículo
 */
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

/**
 * @swagger
 * /api/veiculos:
 *   get:
 *     summary: Listar veículos
 *     tags: [Veículos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de veículos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Veiculo'
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro ao listar veículos
 */
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

/**
 * @swagger
 * /api/veiculos/{id}:
 *   get:
 *     summary: Obter detalhes de um veículo
 *     tags: [Veículos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do veículo
 *     responses:
 *       200:
 *         description: Detalhes do veículo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Veiculo'
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Veículo não encontrado
 *       500:
 *         description: Erro ao obter detalhes do veículo
 */
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

/**
 * @swagger
 * /api/veiculos/{id}:
 *   put:
 *     summary: Atualizar veículo
 *     tags: [Veículos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do veículo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               modelo:
 *                 type: string
 *               cor:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [carro, moto, caminhao]
 *     responses:
 *       200:
 *         description: Veículo atualizado com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Veículo não encontrado
 *       500:
 *         description: Erro ao atualizar veículo
 */
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

/**
 * @swagger
 * /api/veiculos/{id}:
 *   delete:
 *     summary: Deletar veículo
 *     tags: [Veículos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do veículo
 *     responses:
 *       200:
 *         description: Veículo deletado com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Veículo não encontrado
 *       500:
 *         description: Erro ao deletar veículo
 */
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