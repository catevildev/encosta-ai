const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./config/database');
const { seedDatabase } = require('./config/seed');
const swaggerUi = require('swagger-ui-express');
const specs = require('./config/swagger');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Importação das rotas
const authRoutes = require('./routes/auth');
const empresasRoutes = require('./routes/empresas');
const veiculosRoutes = require('./routes/veiculos');
const registrosRoutes = require('./routes/registros');
const taxasRoutes = require('./routes/taxas');
const configValoresRoutes = require('./routes/config_valores');

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/veiculos', veiculosRoutes);
app.use('/api/registros', registrosRoutes);
app.use('/api/taxas', taxasRoutes);
app.use('/api/config_valores', configValoresRoutes);

const PORT = process.env.PORT || 3000;

// Inicializar banco de dados e servidor
initDatabase().then(() => {
  seedDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  });
}); 