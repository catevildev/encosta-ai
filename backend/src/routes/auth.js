const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Login de administrador
router.post('/admin/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const [admins] = await pool.query('SELECT * FROM administradores WHERE email = ?', [email]);
    
    if (admins.length === 0) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const admin = admins[0];
    const senhaValida = await bcrypt.compare(senha, admin.senha);

    if (!senhaValida) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: admin.id, tipo: 'admin' },
      process.env.JWT_SECRET || 'sua_chave_secreta',
      { expiresIn: '1d' }
    );

    res.json({ token, admin: { id: admin.id, nome: admin.nome, email: admin.email } });
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Login de empresa
router.post('/empresa/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const [empresas] = await pool.query('SELECT * FROM empresas WHERE email = ?', [email]);
    
    if (empresas.length === 0) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const empresa = empresas[0];
    const senhaValida = await bcrypt.compare(senha, empresa.senha);

    if (!senhaValida) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: empresa.id, tipo: 'empresa' },
      process.env.JWT_SECRET || 'sua_chave_secreta',
      { expiresIn: '1d' }
    );

    res.json({ token, empresa: { id: empresa.id, nome: empresa.nome, email: empresa.email, cnpj: empresa.cnpj } });
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

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

module.exports = router; 