const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

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

// Listar vagas da empresa
router.get('/', authMiddleware, async (req, res) => {
  try {
    const empresaId = req.user.tipo === 'admin' ? req.query.empresa_id || req.user.id : req.user.id;
    
    const [vagas] = await pool.query(`
      SELECT v.*, 
             ve.placa, 
             ve.modelo, 
             ve.cor,
             ve.tipo as tipo_veiculo,
             r.data_hora as data_entrada
      FROM vagas v
      LEFT JOIN veiculos ve ON v.veiculo_id = ve.id
      LEFT JOIN registros r ON v.registro_entrada_id = r.id
      WHERE v.empresa_id = ?
      ORDER BY v.numero ASC
    `, [empresaId]);
    
    res.json(vagas);
  } catch (error) {
    console.error('Erro ao listar vagas:', error);
    res.status(500).json({ message: 'Erro ao listar vagas' });
  }
});

// Inicializar vagas padrão (20 vagas) - apenas admin
router.post('/inicializar', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'admin') {
      return res.status(403).json({ message: 'Apenas administradores podem inicializar vagas' });
    }
    
    const { empresa_id, quantidade = 20 } = req.body;
    
    if (!empresa_id) {
      return res.status(400).json({ message: 'empresa_id é obrigatório' });
    }
    
    // Verificar se já existem vagas
    const [existing] = await pool.query('SELECT COUNT(*) as count FROM vagas WHERE empresa_id = ?', [empresa_id]);
    
    if (existing[0].count > 0) {
      return res.status(400).json({ message: 'Vagas já inicializadas para esta empresa' });
    }
    
    // Criar vagas
    const vagas = [];
    for (let i = 1; i <= quantidade; i++) {
      vagas.push([empresa_id, i, 'disponivel']);
    }
    
    await pool.query(
      'INSERT INTO vagas (empresa_id, numero, status) VALUES ?',
      [vagas]
    );
    
    res.json({ message: `${quantidade} vagas criadas com sucesso` });
  } catch (error) {
    console.error('Erro ao inicializar vagas:', error);
    res.status(500).json({ message: 'Erro ao inicializar vagas' });
  }
});

// Ocupar vaga
router.post('/:id/ocupar', authMiddleware, async (req, res) => {
  try {
    const { veiculo_id, registro_entrada_id, tempo_estimado_minutos } = req.body;
    const vagaId = req.params.id;
    
    // Buscar vaga
    const [vagas] = await pool.query('SELECT * FROM vagas WHERE id = ?', [vagaId]);
    if (vagas.length === 0) {
      return res.status(404).json({ message: 'Vaga não encontrada' });
    }
    
    const vaga = vagas[0];
    const empresaId = req.user.tipo === 'admin' ? vaga.empresa_id : req.user.id;
    
    if (vaga.empresa_id !== empresaId) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    if (vaga.status !== 'disponivel') {
      return res.status(400).json({ message: 'Vaga não está disponível' });
    }
    
    // Se não tem registro_entrada_id, buscar registro de entrada ativo do veículo
    let registroId = registro_entrada_id;
    let dataEntrada = new Date();
    
    if (!registroId) {
      // Buscar registro de entrada sem saída
      const [registrosAtivos] = await pool.query(`
        SELECT e.id, e.data_hora 
        FROM registros e 
        LEFT JOIN registros s ON s.veiculo_id = e.veiculo_id AND s.tipo = 'saida' AND s.data_hora > e.data_hora 
        WHERE e.veiculo_id = ? AND e.tipo = 'entrada' AND s.id IS NULL
        ORDER BY e.data_hora DESC LIMIT 1
      `, [veiculo_id]);
      
      if (registrosAtivos.length > 0) {
        registroId = registrosAtivos[0].id;
        dataEntrada = registrosAtivos[0].data_hora;
      }
    } else {
      // Buscar data de entrada do registro fornecido
      const [registros] = await pool.query('SELECT data_hora FROM registros WHERE id = ?', [registro_entrada_id]);
      if (registros.length > 0) {
        dataEntrada = registros[0].data_hora;
      }
    }
    
    // Calcular tempo limite se tempo estimado foi fornecido
    let tempoLimite = null;
    if (tempo_estimado_minutos && dataEntrada) {
      const dataLimite = new Date(dataEntrada);
      dataLimite.setMinutes(dataLimite.getMinutes() + tempo_estimado_minutos);
      tempoLimite = dataLimite;
    }
    
    await pool.query(
      'UPDATE vagas SET status = ?, veiculo_id = ?, registro_entrada_id = ?, data_entrada = ?, tempo_estimado_minutos = ?, tempo_limite = ? WHERE id = ?',
      ['estacionado', veiculo_id, registroId, dataEntrada, tempo_estimado_minutos || null, tempoLimite, vagaId]
    );
    
    res.json({ message: 'Vaga ocupada com sucesso' });
  } catch (error) {
    console.error('Erro ao ocupar vaga:', error);
    res.status(500).json({ message: 'Erro ao ocupar vaga', error: error.message });
  }
});

// Liberar vaga
router.post('/:id/liberar', authMiddleware, async (req, res) => {
  try {
    const vagaId = req.params.id;
    
    const [vagas] = await pool.query('SELECT * FROM vagas WHERE id = ?', [vagaId]);
    if (vagas.length === 0) {
      return res.status(404).json({ message: 'Vaga não encontrada' });
    }
    
    const vaga = vagas[0];
    const empresaId = req.user.tipo === 'admin' ? vaga.empresa_id : req.user.id;
    
    if (vaga.empresa_id !== empresaId) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    await pool.query(
      'UPDATE vagas SET status = ?, veiculo_id = NULL, registro_entrada_id = NULL, data_entrada = NULL WHERE id = ?',
      ['disponivel', vagaId]
    );
    
    res.json({ message: 'Vaga liberada com sucesso' });
  } catch (error) {
    console.error('Erro ao liberar vaga:', error);
    res.status(500).json({ message: 'Erro ao liberar vaga' });
  }
});

// Atualizar status da vaga
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const vagaId = req.params.id;
    
    const statusValidos = ['disponivel', 'estacionado', 'pagando', 'indisponivel', 'manutencao'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }
    
    const [vagas] = await pool.query('SELECT * FROM vagas WHERE id = ?', [vagaId]);
    if (vagas.length === 0) {
      return res.status(404).json({ message: 'Vaga não encontrada' });
    }
    
    const vaga = vagas[0];
    const empresaId = req.user.tipo === 'admin' ? vaga.empresa_id : req.user.id;
    
    if (vaga.empresa_id !== empresaId) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    await pool.query('UPDATE vagas SET status = ? WHERE id = ?', [status, vagaId]);
    
    res.json({ message: 'Status da vaga atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar status da vaga:', error);
    res.status(500).json({ message: 'Erro ao atualizar status da vaga' });
  }
});

// Calcular valor da vaga
router.get('/:id/calcular-valor', authMiddleware, async (req, res) => {
  try {
    const vagaId = req.params.id;
    
    const [vagas] = await pool.query(`
      SELECT v.*, ve.tipo as tipo_veiculo, ve.empresa_id
      FROM vagas v
      LEFT JOIN veiculos ve ON v.veiculo_id = ve.id
      WHERE v.id = ?
    `, [vagaId]);
    
    if (vagas.length === 0) {
      return res.status(404).json({ message: 'Vaga não encontrada' });
    }
    
    const vaga = vagas[0];
    const empresaId = req.user.tipo === 'admin' ? vaga.empresa_id : req.user.id;
    
    if (vaga.empresa_id !== empresaId) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    if (!vaga.data_entrada) {
      return res.status(400).json({ message: 'Vaga não possui data de entrada' });
    }
    
    const dataEntrada = new Date(vaga.data_entrada);
    const dataAtual = new Date();
    const tempoPermanencia = Math.floor((dataAtual - dataEntrada) / 1000 / 60); // minutos
    
    // Buscar configuração de valores
    const [config] = await pool.query(
      'SELECT * FROM config_valores WHERE empresa_id = ? AND tipo_veiculo = ?',
      [empresaId, vaga.tipo_veiculo]
    );
    
    if (config.length === 0) {
      return res.status(400).json({ message: 'Configuração de valores não encontrada' });
    }
    
    const valores = config[0];
    const valorHora = Number(valores.valor_hora);
    const valorFracao = Number(valores.valor_fracao);
    
    // Calcular horas e minutos
    const horas = Math.floor(tempoPermanencia / 60);
    const minutos = tempoPermanencia % 60;
    const fracoes = Math.max(1, Math.ceil(minutos / 15));
    
    // Calcular valor total
    const valorTotal = (horas * valorHora) + (fracoes * valorFracao);
    
    // Verificar se ultrapassou o tempo limite
    let ultrapassouTempo = false;
    if (vaga.tempo_limite) {
      ultrapassouTempo = dataAtual > new Date(vaga.tempo_limite);
    }
    
    res.json({
      valorTotal,
      tempoPermanencia,
      horas,
      minutos,
      ultrapassouTempo,
      tempoLimite: vaga.tempo_limite,
      tempoEstimado: vaga.tempo_estimado_minutos
    });
  } catch (error) {
    console.error('Erro ao calcular valor:', error);
    res.status(500).json({ message: 'Erro ao calcular valor' });
  }
});

// Processar pagamento e finalizar saída
router.post('/:id/finalizar-saida', authMiddleware, async (req, res) => {
  try {
    const { tipo_pagamento, numero_documento, valor_cobrado } = req.body;
    const vagaId = req.params.id;
    
    if (!tipo_pagamento || !numero_documento || valor_cobrado === undefined) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }
    
    const [vagas] = await pool.query(`
      SELECT v.*, ve.id as veiculo_id, ve.empresa_id
      FROM vagas v
      LEFT JOIN veiculos ve ON v.veiculo_id = ve.id
      WHERE v.id = ?
    `, [vagaId]);
    
    if (vagas.length === 0) {
      return res.status(404).json({ message: 'Vaga não encontrada' });
    }
    
    const vaga = vagas[0];
    const empresaId = req.user.tipo === 'admin' ? vaga.empresa_id : req.user.id;
    
    if (vaga.empresa_id !== empresaId) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    if (vaga.status !== 'pagando') {
      return res.status(400).json({ message: 'Vaga não está em processo de pagamento' });
    }
    
    // Calcular valor esperado
    const dataEntrada = new Date(vaga.data_entrada);
    const dataAtual = new Date();
    const tempoPermanencia = Math.floor((dataAtual - dataEntrada) / 1000 / 60);
    
    const [config] = await pool.query(
      'SELECT * FROM config_valores WHERE empresa_id = ? AND tipo_veiculo = ?',
      [empresaId, vaga.tipo_veiculo]
    );
    
    if (config.length === 0) {
      return res.status(400).json({ message: 'Configuração de valores não encontrada' });
    }
    
    const valores = config[0];
    const valorHora = Number(valores.valor_hora);
    const valorFracao = Number(valores.valor_fracao);
    const horas = Math.floor(tempoPermanencia / 60);
    const minutos = tempoPermanencia % 60;
    const fracoes = Math.max(1, Math.ceil(minutos / 15));
    const valorEsperado = (horas * valorHora) + (fracoes * valorFracao);
    
    // Verificar se o valor bate (tolerância de 0.01)
    const diferenca = Math.abs(valor_cobrado - valorEsperado);
    if (diferenca > 0.01) {
      return res.status(400).json({ 
        message: 'Valor não confere',
        valorEsperado,
        valorCobrado: valor_cobrado,
        diferenca
      });
    }
    
    // Registrar saída
    const [result] = await pool.query(
      'INSERT INTO registros (veiculo_id, empresa_id, tipo, valor, tempo_permanencia) VALUES (?, ?, "saida", ?, ?)',
      [vaga.veiculo_id, empresaId, valor_cobrado, tempoPermanencia]
    );
    
    // Liberar vaga
    await pool.query(
      'UPDATE vagas SET status = ?, veiculo_id = NULL, registro_entrada_id = NULL, data_entrada = NULL, tempo_estimado_minutos = NULL, tempo_limite = NULL WHERE id = ?',
      ['disponivel', vagaId]
    );
    
    res.json({ 
      message: 'Saída finalizada com sucesso',
      registro_id: result.insertId,
      valor: valor_cobrado,
      tempoPermanencia
    });
  } catch (error) {
    console.error('Erro ao finalizar saída:', error);
    res.status(500).json({ message: 'Erro ao finalizar saída' });
  }
});

// Marcar vaga como pagando (iniciar processo de pagamento)
router.post('/:id/iniciar-pagamento', authMiddleware, async (req, res) => {
  try {
    const vagaId = req.params.id;
    
    const [vagas] = await pool.query('SELECT * FROM vagas WHERE id = ?', [vagaId]);
    if (vagas.length === 0) {
      return res.status(404).json({ message: 'Vaga não encontrada' });
    }
    
    const vaga = vagas[0];
    const empresaId = req.user.tipo === 'admin' ? vaga.empresa_id : req.user.id;
    
    if (vaga.empresa_id !== empresaId) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    if (vaga.status !== 'estacionado') {
      return res.status(400).json({ message: 'Vaga não está estacionada' });
    }
    
    await pool.query('UPDATE vagas SET status = ? WHERE id = ?', ['pagando', vagaId]);
    
    res.json({ message: 'Processo de pagamento iniciado' });
  } catch (error) {
    console.error('Erro ao iniciar pagamento:', error);
    res.status(500).json({ message: 'Erro ao iniciar pagamento' });
  }
});

module.exports = router;

