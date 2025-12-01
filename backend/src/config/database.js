const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'estacionai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const initDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Dropar tabelas existentes na ordem correta (respeitando foreign keys)
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS vagas');
    await connection.query('DROP TABLE IF EXISTS registros');
    await connection.query('DROP TABLE IF EXISTS config_valores');
    await connection.query('DROP TABLE IF EXISTS veiculos');
    await connection.query('DROP TABLE IF EXISTS taxas');
    await connection.query('DROP TABLE IF EXISTS empresas');
    await connection.query('DROP TABLE IF EXISTS administradores');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Criar tabela de administradores
    await connection.query(`
      CREATE TABLE IF NOT EXISTS administradores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar tabela de empresas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS empresas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        cnpj VARCHAR(14) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        telefone VARCHAR(20),
        endereco TEXT,
        total_vagas INT DEFAULT 20,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar tabela de taxas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS taxas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa_id INT NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        periodo VARCHAR(20) NOT NULL,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
      )
    `);

    // Criar tabela de veículos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS veiculos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa_id INT NOT NULL,
        placa VARCHAR(10) NOT NULL,
        modelo VARCHAR(100),
        cor VARCHAR(50),
        tipo ENUM('carro', 'moto', 'caminhao') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
      )
    `);

    // Criar tabela de registros
    await connection.query(`
      CREATE TABLE IF NOT EXISTS registros (
        id INT AUTO_INCREMENT PRIMARY KEY,
        veiculo_id INT NOT NULL,
        empresa_id INT NOT NULL,
        tipo ENUM('entrada', 'saida') NOT NULL,
        data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        valor DECIMAL(10,2),
        saida_id INT,
        tempo_permanencia DECIMAL(10,2),
        FOREIGN KEY (veiculo_id) REFERENCES veiculos(id),
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
      )
    `);

    // Criar tabela de configuração de valores
    await connection.query(`
      CREATE TABLE IF NOT EXISTS config_valores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa_id INT NOT NULL,
        tipo_veiculo ENUM('carro', 'moto', 'caminhao') NOT NULL,
        valor_hora DECIMAL(10,2) NOT NULL,
        valor_fracao DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id),
        UNIQUE KEY unique_tipo_empresa (empresa_id, tipo_veiculo)
      )
    `);

    // Criar tabela de vagas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vagas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa_id INT NOT NULL,
        numero INT NOT NULL,
        status ENUM('disponivel', 'estacionado', 'pagando', 'indisponivel', 'manutencao') DEFAULT 'disponivel',
        veiculo_id INT NULL,
        registro_entrada_id INT NULL,
        data_entrada TIMESTAMP NULL,
        tempo_estimado_minutos INT NULL,
        tempo_limite TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
        FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE SET NULL,
        FOREIGN KEY (registro_entrada_id) REFERENCES registros(id) ON DELETE SET NULL,
        UNIQUE KEY unique_empresa_vaga (empresa_id, numero)
      )
    `);

    // Migração: Adicionar colunas se não existirem
    try {
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'vagas' 
        AND COLUMN_NAME = 'tempo_estimado_minutos'
      `);
      
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE vagas 
          ADD COLUMN tempo_estimado_minutos INT NULL
        `);
        console.log('Coluna tempo_estimado_minutos adicionada à tabela vagas');
      }
    } catch (error) {
      console.log('Erro ao adicionar coluna tempo_estimado_minutos:', error.message);
    }

    try {
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'vagas' 
        AND COLUMN_NAME = 'tempo_limite'
      `);
      
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE vagas 
          ADD COLUMN tempo_limite TIMESTAMP NULL
        `);
        console.log('Coluna tempo_limite adicionada à tabela vagas');
      }
    } catch (error) {
      console.log('Erro ao adicionar coluna tempo_limite:', error.message);
    }

    // Migração: Adicionar coluna total_vagas na tabela empresas se não existir
    try {
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'empresas' 
        AND COLUMN_NAME = 'total_vagas'
      `);
      
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE empresas 
          ADD COLUMN total_vagas INT DEFAULT 20
        `);
        console.log('Coluna total_vagas adicionada à tabela empresas');
      }
    } catch (error) {
      console.log('Erro ao adicionar coluna total_vagas:', error.message);
    }

    connection.release();
    console.log('Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
  }
};

module.exports = { pool, initDatabase }; 