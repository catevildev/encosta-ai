const bcrypt = require('bcryptjs');
const { pool } = require('./database');

const seedDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Verificar se já existe um admin
    const [admins] = await connection.query('SELECT * FROM administradores WHERE email = ?', ['admin@estacionai.com']);
    
    if (admins.length === 0) {
      // Criar senha hash
      const senhaHash = await bcrypt.hash('admin123', 10);
      
      // Inserir admin
      await connection.query(
        'INSERT INTO administradores (nome, email, senha) VALUES (?, ?, ?)',
        ['Administrador', 'admin@estacionai.com', senhaHash]
      );
      
      console.log('Administrador criado com sucesso!');
    } else {
      console.log('Administrador já existe!');
    }
    
    connection.release();
  } catch (error) {
    console.error('Erro ao criar administrador:', error);
  }
};

module.exports = { seedDatabase }; 