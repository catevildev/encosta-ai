const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

/**
 * @swagger
 * components:
 *   schemas:
 *     Registro:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID do registro
 *         veiculo_id:
 *           type: integer
 *           description: ID do veículo
 *         tipo:
 *           type: string
 *           enum: [entrada, saida]
 *           description: Tipo do registro
 *         data_hora:
 *           type: string
 *           format: date-time
 *           description: Data e hora do registro
 *         valor:
 *           type: number
 *           format: float
 *           description: Valor cobrado (apenas para saída)
 *         placa:
 *           type: string
 *           description: Placa do veículo
 *         modelo:
 *           type: string
 *           description: Modelo do veículo
 *         tipo_veiculo:
 *           type: string
 *           description: Tipo do veículo
 *         empresa_nome:
 *           type: string
 *           description: Nome da empresa
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
 * /api/registros/entrada:
 *   post:
 *     summary: Registrar entrada de veículo
 *     tags: [Registros]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - placa
 *               - tipo
 *             properties:
 *               placa:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [carro, moto, caminhao]
 *     responses:
 *       201:
 *         description: Entrada registrada com sucesso
 *       400:
 *         description: Veículo já está no estacionamento
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro ao registrar entrada
 */
router.post('/entrada', async (req, res) => {
  const { placa, tipo } = req.body;
  
  try {
    console.log('Tentando registrar entrada para:', { placa, tipo });
    
    // Verificar se o veículo existe e pertence à empresa
    const [veiculos] = await pool.query(
      'SELECT id, empresa_id, tipo FROM veiculos WHERE placa = ?',
      [placa]
    );
    
    if (veiculos.length === 0) {
      console.log('Veículo não encontrado:', placa);
      return res.status(400).json({ 
        error: 'Veículo não encontrado',
        details: 'A placa informada não está cadastrada no sistema'
      });
    }
    
    const veiculo = veiculos[0];
    console.log('Veículo encontrado:', veiculo);
    
    // Verificar se já existe uma entrada sem saída correspondente
    const [registros] = await pool.query(
      `SELECT e.id, e.data_hora 
       FROM registros e 
       LEFT JOIN registros s ON s.veiculo_id = e.veiculo_id AND s.tipo = 'saida' AND s.data_hora > e.data_hora 
       WHERE e.veiculo_id = ? AND e.tipo = 'entrada' AND s.id IS NULL`,
      [veiculo.id]
    );
    
    if (registros.length > 0) {
      console.log('Veículo já está estacionado:', veiculo);
      return res.status(400).json({ 
        error: 'Veículo já está estacionado',
        details: 'Este veículo já possui um registro de entrada sem saída'
      });
    }
    
    // Registrar entrada
    const [result] = await pool.query(
      'INSERT INTO registros (veiculo_id, empresa_id, tipo) VALUES (?, ?, "entrada")',
      [veiculo.id, veiculo.empresa_id]
    );
    
    console.log('Entrada registrada com sucesso:', result.insertId);
    res.json({ 
      message: 'Entrada registrada com sucesso',
      registro_id: result.insertId,
      veiculo: {
        id: veiculo.id,
        placa,
        tipo: veiculo.tipo
      }
    });
  } catch (error) {
    console.error('Erro ao registrar entrada:', error);
    res.status(500).json({ 
      error: 'Erro ao registrar entrada',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/registros/saida:
 *   post:
 *     summary: Registrar saída de veículo
 *     tags: [Registros]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - placa
 *               - senha
 *             properties:
 *               placa:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Saída registrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 placa:
 *                   type: string
 *                 valorTotal:
 *                   type: number
 *                   format: float
 *                 tempoPermanencia:
 *                   type: string
 *       400:
 *         description: Veículo não está no estacionamento
 *       401:
 *         description: Senha incorreta
 *       500:
 *         description: Erro ao registrar saída
 */
router.post('/saida', async (req, res) => {
  const { placa, senha } = req.body;
  
  try {
    // Verificar se o veículo existe e pertence à empresa
    const [veiculos] = await pool.query(
      'SELECT v.id, v.empresa_id, v.tipo, e.senha FROM veiculos v ' +
      'JOIN empresas e ON v.empresa_id = e.id ' +
      'WHERE v.placa = ?',
      [placa]
    );
    
    if (veiculos.length === 0) {
      return res.status(400).json({ error: 'Veículo não encontrado' });
    }
    
    const veiculo = veiculos[0];
    
    // Verificar senha da empresa
    if (!bcrypt.compareSync(senha, veiculo.senha)) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }
    
    // Buscar registro de entrada mais recente sem saída
    const [registros] = await pool.query(
      `SELECT e.id, e.data_hora 
       FROM registros e 
       LEFT JOIN registros s ON s.veiculo_id = e.veiculo_id AND s.tipo = 'saida' AND s.data_hora > e.data_hora 
       WHERE e.veiculo_id = ? AND e.tipo = 'entrada' AND s.id IS NULL 
       ORDER BY e.data_hora DESC LIMIT 1`,
      [veiculo.id]
    );
    
    if (registros.length === 0) {
      return res.status(400).json({ error: 'Não há entrada registrada para este veículo' });
    }
    
    const entrada = registros[0];
    const dataEntrada = new Date(entrada.data_hora);
    const dataSaida = new Date();
    
    // Calcular tempo de permanência em minutos
    const tempoPermanencia = Math.floor((dataSaida - dataEntrada) / 1000 / 60);
    
    // Buscar configuração de valores
    const [config] = await pool.query(
      'SELECT * FROM config_valores WHERE empresa_id = ? AND tipo_veiculo = ?',
      [veiculo.empresa_id, veiculo.tipo]
    );
    
    if (config.length === 0) {
      return res.status(400).json({ error: 'Configuração de valores não encontrada' });
    }
    
    const valores = config[0];
    // Garantir que os valores são numéricos
    const valorHora = Number(valores.valor_hora);
    const valorFracao = Number(valores.valor_fracao);
    
    // Calcular horas e minutos de permanência
    const horas = Math.floor(tempoPermanencia / 60);
    const minutos = tempoPermanencia % 60;
    // Calcular o número de frações de 15 minutos (mínimo 1 fração)
    const fracoes = Math.max(1, Math.ceil(minutos / 15));
    
    // Calcular valor total: valor por hora + valor por fração
    const valorTotal = (horas * valorHora) + (fracoes * valorFracao);
    
    // Registrar saída
    const [result] = await pool.query(
      'INSERT INTO registros (veiculo_id, empresa_id, tipo, valor, tempo_permanencia) VALUES (?, ?, "saida", ?, ?)',
      [veiculo.id, veiculo.empresa_id, valorTotal, tempoPermanencia]
    );
    
    res.json({
      message: 'Saída registrada com sucesso',
      placa,
      valorTotal,
      tempoPermanencia: `${horas}h ${minutos}m`
    });
  } catch (error) {
    console.error('Erro ao registrar saída:', error);
    res.status(500).json({ 
      error: 'Erro ao registrar saída',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/registros:
 *   get:
 *     summary: Listar registros
 *     tags: [Registros]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de registros
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Registro'
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro ao listar registros
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = `
      SELECT r.*, v.placa, v.modelo, v.tipo as tipo_veiculo, e.nome as empresa_nome 
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