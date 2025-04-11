# EstacionaAI

Sistema de gerenciamento de estacionamentos desenvolvido com React Native e Node.js.

## Funcionalidades

- Login de administrador e empresas
- Cadastro e gerenciamento de empresas
- Cadastro e gerenciamento de veículos
- Registro de entrada e saída de veículos
- Cálculo automático de taxas
- Relatórios de movimentação
- Interface moderna e intuitiva

## Requisitos

- Node.js 14+
- MySQL 5.7+
- Expo CLI
- React Native

## Instalação

### Backend

1. Entre na pasta do backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o arquivo .env com suas credenciais do MySQL:
```
PORT=3000
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=estacionai
JWT_SECRET=sua_chave_secreta
```

4. Inicie o servidor:
```bash
npm run dev
```

### Frontend

1. Entre na pasta do frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o aplicativo:
```bash
npm start
```

4. Use o Expo Go no seu dispositivo móvel para testar o aplicativo

## Estrutura do Banco de Dados

O sistema criará automaticamente as seguintes tabelas:

- administradores
- empresas
- veiculos
- taxas
- registros

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes. 