# Sistema de Estacionamento de Veículos (EstacionaAi)
## Especificação de Requisitos de Software

**Versão:** 4.0
**Data:** 02/12/2025
**Autor:** Khristtony De Oliveira Ruiz (Atualizado por Antigravity)

---

## Histórico da Revisão

| Data | Versão | Descrição | Autor |
| :--- | :--- | :--- | :--- |
| 12/03/2025 | 1.0 | Início do pré-projeto | Khristtony |
| 15/04/2025 | 2.0 | Desenvolvimento iniciado | Khristtony |
| 11/06/2025 | 3.0 | Finalizado fluxograma | Khristtony |
| 02/12/2025 | 4.0 | Atualização com implementação técnica atual (Vagas, Tarifas Dinâmicas) | Antigravity |

---

## 1. Introdução

### 1.1 Finalidade
O **EstacionaAi** foi desenvolvido para modernizar e automatizar a gestão de estacionamentos, oferecendo controle total sobre entrada e saída de veículos, monitoramento de permanência, cálculo de valores, configuração de preços e geração de relatórios. O sistema visa proporcionar uma operação eficiente, minimizando erros manuais e maximizando a satisfação de operadores e clientes.

### 1.2 Visão Geral
O sistema foi construído pensando na praticidade do dia a dia. A interface intuitiva permite que os operadores realizem suas tarefas com poucos cliques, enquanto os gestores têm acesso a informações cruciais para a tomada de decisões. Utilizamos tecnologias modernas como **Node.js**, **React Native** e **MySQL** para garantir robustez e confiabilidade.

O sistema oferece um conjunto abrangente de funcionalidades:
*   **Gestão de Entrada de Veículos:** Registro simplificado com validação de placa, seleção de tipo e verificação de vagas.
*   **Monitoramento de Permanência:** Visualização em tempo real dos veículos estacionados e status das vagas.
*   **Processo de Saída:** Cálculo automático do valor baseado no tempo e baixa automática no sistema.
*   **Gestão de Preços:** Configuração por tipo de veículo (Carro, Moto, Caminhão) e definição de valores para hora e frações.

### 1.3 Definições, Acrônimos e Abreviações
*   **CRUD:** Create, Read, Update, Delete (Criar, Ler, Atualizar, Excluir).
*   **API:** Application Programming Interface.
*   **JWT:** JSON Web Token (Autenticação segura).
*   **UX/UI:** User Experience / User Interface.
*   **MySQL:** Sistema de gerenciamento de banco de dados relacional.
*   **PWA:** Progressive Web App.

---

## 2. Descrição Geral

O EstacionaAi é projetado para atender às demandas do dia a dia de um estacionamento através de uma interface moderna e responsiva. O painel principal apresenta informações em tempo real sobre os veículos estacionados e o status das vagas (Disponível, Estacionado, Pagando, Manutenção).

A experiência do usuário foi priorizada em cada aspecto do sistema. Os operadores encontram facilmente as funções mais utilizadas, como registro de entrada e saída. O processo de finalização é simplificado, calculando automaticamente os valores com base nas regras configuradas no módulo de `config_valores`.

---

## 3. Requisitos Específicos

### 3.1 Requisitos Funcionais

#### 3.1.1 Controle de Entrada de Veículos
O processo de entrada foi simplificado para garantir rapidez.
*   O operador seleciona uma vaga disponível no grid.
*   Registra a placa do veículo (validação automática de formato).
*   Seleciona o tipo de veículo (Carro, Moto, Caminhão).
*   O sistema cria automaticamente o registro do veículo (se novo) e registra a entrada na tabela `registros`.
*   A vaga tem seu status atualizado para 'estacionado'.

#### 3.1.2 Monitoramento de Veículos e Vagas
O painel principal oferece uma visão clara do estacionamento através de um grid de vagas.
*   **Visualização:** Cada vaga mostra seu número e status atual (codificado por cores).
*   **Detalhes:** Ao clicar em uma vaga ocupada, exibe-se a placa, modelo, hora de entrada e tempo decorrido.
*   **Busca:** Permite localizar rapidamente um veículo pela placa.

#### 3.1.3 Gestão de Preços (Tarifação Dinâmica)
O módulo de gestão de preços permite configuração flexível das tarifas por empresa.
*   **Configuração:** Definição de `valor_hora` (1ª hora) e `valor_fracao` (15 min adicionais).
*   **Por Tipo:** Valores distintos para Carro, Moto e Caminhão.
*   **Persistência:** Dados salvos na tabela `config_valores`.

#### 3.1.4 Relatórios Gerenciais
O sistema oferece relatórios para acompanhamento financeiro e operacional.
*   **Filtros:** Por período (data início e fim).
*   **Dados:** Quantidade de veículos, valor total arrecadado, detalhamento por tipo de veículo.
*   **Exportação:** Visualização em lista na interface (exportação para PDF planejada).

#### 3.1.5 Gestão de Empresas e Acesso (Admin)
*   **Multi-tenancy:** Suporte a múltiplas empresas de estacionamento.
*   **Admin:** Painel administrativo para cadastro de novas empresas e usuários.
*   **Autenticação:** Login seguro separado para Administradores e Empresas.

### 3.2 Requisitos Não Funcionais

#### 3.2.1 Desempenho e Escalabilidade
*   Operações de entrada/saída processadas em menos de 2 segundos.
*   Backend Node.js assíncrono capaz de lidar com múltiplas requisições simultâneas.
*   Banco de dados MySQL otimizado com índices nas colunas de busca frequente (placa, data_hora).

#### 3.2.2 Segurança e Confiabilidade
*   Senhas criptografadas com `bcrypt`.
*   Autenticação via Token JWT (expiração de 1 dia).
*   Validação de dados no backend para prevenir injeção de SQL e dados inválidos.

#### 3.2.3 Usabilidade
*   Interface Mobile-First desenvolvida em React Native.
*   Feedback visual imediato (Toasts/Alertas) para ações de sucesso ou erro.
*   Ícones intuitivos (`lucide-react-native`) para facilitar a navegação.

### 3.3 Atributos do Sistema de Software

#### 3.3.1 Restrições do Design
*   **Backend:** Node.js com Express.
*   **Frontend:** React Native (Expo).
*   **Banco de Dados:** MySQL 5.7+.
*   **Linguagem:** JavaScript (ES6+).

#### 3.3.2 Interfaces de Usuário
*   Dashboard principal com Grid de Vagas.
*   Telas de Login distintas (Admin/Empresa).
*   Modal de Cobrança com cálculo detalhado (Permanência, Valor Hora, Valor Fração).

#### 3.3.3 Interfaces de Software
*   **API RESTful:** Documentada com Swagger (`/api-docs`).
*   **Dependências Principais:**
    *   `express`: Servidor Web.
    *   `mysql2`: Conexão com Banco de Dados.
    *   `jsonwebtoken`: Autenticação.
    *   `react-navigation`: Navegação no App.
    *   `axios`: Cliente HTTP.

---

## 4. Riscos e Estratégias

### 4.1 Riscos Identificados
*   Falhas de conectividade com a internet (para sincronização).
*   Inconsistências em cálculos se a configuração de preços for alterada durante uma estadia.
*   Perda de dados em caso de falha catastrófica do servidor de banco de dados.

### 4.2 Estratégias de Gerenciamento
*   **Validação no Backend:** O cálculo do valor é sempre revalidado no servidor antes de fechar a conta.
*   **Tratamento de Erros:** O App possui tratamento de erros robusto para alertar sobre falhas de conexão.
*   **Backups:** Recomendação de backups diários do banco MySQL (`mysqldump`).

---

## 5. Referências

*   **Repositório:** [GitHub - encosta-ai](https://github.com/catevildev/encosta-ai)
*   **Fluxograma:** [Miro Board](https://miro.com/welcomeonboard/MWdXT3p4R0ZIa1pjalZtbVRmWHpYeTZiVHI4S1c3OFBndjZTeEpJWGtMR0wwTzdIa2Z0emZvdGNKWFpsNDE1MWZlUXZXOEVoWDhWdWdVRk0rZUNFYjNUamFvaXFFRVR1RXpoa1FWTmNWSjVJeHQxS2xadGoxY1FZK0dhbEpnZE1BS2NFMDFkcUNFSnM0d3FEN050ekl3PT0hdjE=?share_link_id=117934841614)
