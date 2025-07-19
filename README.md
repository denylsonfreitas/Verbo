# Verbo - Jogo de Adivinhação de Verbos

Um jogo online inspirado no Term.ooo/Wordle, onde os jogadores tentam adivinhar um verbo de 5 letras em português por dia. Cada jogador tem 6 tentativas para descobrir o verbo correto, com feedback visual após cada tentativa.

## 🎮 Como Jogar

- **Objetivo**: Adivinhe o verbo de **5 letras** do dia em até **6 tentativas**
- **Verbo único**: O mesmo verbo é válido para todos os jogadores no mesmo dia
- **Feedback visual** após cada tentativa:
  - 🟢 **Verde**: letra correta na posição correta
  - 🟡 **Amarelo**: letra correta na posição errada
  - ⚫ **Cinza**: letra não está na palavra
- **Modo Hard**: Use as dicas das tentativas anteriores obrigatoriamente
- **Estatísticas**: Acompanhe seu progresso e compare com outros jogadores

## 🚀 Tecnologias e Arquitetura

### Frontend
- **React 18** + **TypeScript** + **TailwindCSS**
- **Vite** como bundler
- **Context API** para gerenciamento de estado
- **Axios** para comunicação com API
- **React Router** para navegação
- **Lucide React** para ícones
- **Sistema de autenticação** completo com JWT
- **Modais responsivos** para login/registro
- **Toast notifications** para feedback

### Backend  
- **Node.js** + **Express** + **TypeScript**
- **MongoDB** com **Mongoose** ODM
- **JWT** para autenticação e autorização
- **Bcrypt** para criptografia de senhas
- **Nodemailer** para envio de emails
- **Sistema de auditoria** completo
- **Helmet** + **CORS** para segurança
- **Rate limiting** avançado por tipo de operação
- **Joi** para validação de dados
- **Middleware de autenticação** robusto

### Infraestrutura
- **Frontend**: GitHub Pages ou Vercel
- **Backend**: Render ou Railway
- **Banco**: MongoDB Atlas
- **CI/CD**: GitHub Actions

## 📦 Instalação e Execução

### Pré-requisitos
- **Node.js** 18+ 
- **MongoDB** (local ou Atlas)
- **Git**

### 1. Clone e configure o projeto

```bash
git clone <url-do-repositorio>
cd verbo
```

### 2. Instale todas as dependências

```bash
npm run install:all
```

### 3. Configure o ambiente

```bash
# Backend - Crie e configure o .env
cp app/backend/.env.example app/backend/.env
```

**Variáveis obrigatórias no `.env`:**
```env
# Servidor
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Banco de dados
MONGODB_URI=mongodb://localhost:27017/verbo-game
# ou para MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/verbo (solicitar à equipe)

# Segurança
JWT_SECRET=seu-jwt-secret-super-seguro-aqui-com-pelo-menos-32-caracteres
ADMIN_PASSWORD= (solicitar à equipe)

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configurações de Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com (solicitar à equipe)
SMTP_PASS=sua-senha-de-app (solicitar à equipe)
```

### 4. Popule o banco de dados

```bash
# Execute o script de seed para criar os verbos iniciais
cd app/backend
npm run seed
```

### 5. Execute o projeto

```bash
# Executar frontend e backend simultaneamente (recomendado)
npm run dev

# OU executar separadamente:
npm run dev:frontend  # Apenas frontend (porta 3000)
npm run dev:backend   # Apenas backend (porta 5000)
```

**URLs de acesso:**
- 🎮 **Jogo**: http://localhost:3000
- 📊 **Estatísticas**: http://localhost:3000/stats  
- ⚙️ **Configurações**: http://localhost:3000/options
- 🔧 **Admin**: http://localhost:3000/admin
- 🔑 **Reset de Senha**: http://localhost:3000/reset-password
- 🔗 **API**: http://localhost:5000/api

## 📁 Estrutura Detalhada do Projeto

```
verbo/
├── 📁 app/                       # Aplicação principal
│   ├── 📁 backend/              # API Node.js + Express + TypeScript
│   │   ├── 📁 config/           # Configurações
│   │   │   └── database.ts      # Conexão MongoDB
│   │   ├── 📁 controllers/      # Controladores
│   │   │   └── authController.ts # Autenticação e usuários
│   │   ├── 📁 middleware/       # Middlewares
│   │   │   ├── auth.ts          # Autenticação JWT
│   │   │   ├── errorHandler.ts  # Tratamento de erros
│   │   │   └── rateLimiting.ts  # Rate limiting
│   │   ├── 📁 models/           # Modelos do banco
│   │   │   ├── Verb.ts          # Modelo de verbos
│   │   │   ├── CommonWord.ts    # Palavras comuns
│   │   │   ├── User.ts          # Modelo de usuários
│   │   │   ├── AuditLog.ts      # Logs de auditoria
│   │   │   ├── PasswordResetToken.ts # Tokens de reset
│   │   │   └── EmailVerificationToken.ts # Tokens de email
│   │   ├── 📁 routes/           # Rotas da API
│   │   │   ├── verbRoutes.ts    # /api/verb/* (jogo)
│   │   │   ├── wordRoutes.ts    # /api/words/* (validação)
│   │   │   ├── authRoutes.ts    # /api/auth/* (autenticação)
│   │   │   ├── adminRoutes.ts   # /api/admin/* (admin verbos)
│   │   │   └── adminAuthRoutes.ts # /api/admin-auth/* (admin usuarios)
│   │   ├── 📁 scripts/          # Scripts utilitários
│   │   │   └── seed.ts          # Popular banco com verbos
│   │   ├── 📁 services/         # Serviços
│   │   │   └── emailService.ts  # Serviço de email
│   │   ├── 📁 utils/            # Utilitários
│   │   │   ├── validation.ts    # Validações
│   │   │   └── brazilTime.ts    # Fuso horário brasileiro
│   │   ├── server.ts            # Servidor principal
│   │   ├── package.json         # Dependências backend
│   │   └── .env.example         # Exemplo de variáveis
│   └── 📁 frontend/             # Aplicação React + TypeScript
│       ├── 📁 public/           # Arquivos públicos
│       │   ├── icon.png         # Ícone do app
│       │   └── manifest.json    # PWA manifest
│       ├── 📁 src/
│       │   ├── 📁 components/   # Componentes reutilizáveis
│       │   │   ├── GameBoard.tsx      # Tabuleiro do jogo
│       │   │   ├── Keyboard.tsx       # Teclado virtual
│       │   │   ├── LetterTile.tsx     # Célula de letra
│       │   │   ├── Header.tsx         # Cabeçalho
│       │   │   ├── LoginModal.tsx     # Modal de login
│       │   │   ├── RegisterModal.tsx  # Modal de registro
│       │   │   ├── ForgotPasswordModal.tsx # Modal recuperar senha
│       │   │   ├── Toast.tsx          # Notificações
│       │   │   ├── Tutorial.tsx       # Tutorial do jogo
│       │   │   ├── WordHistory.tsx    # Histórico de palavras
│       │   │   └── ...                # Outros componentes
│       │   ├── 📁 contexts/     # Context API
│       │   │   ├── GameContext.tsx    # Estado global do jogo
│       │   │   ├── AuthContext.tsx    # Estado de autenticação
│       │   │   └── TutorialContext.tsx # Estado do tutorial
│       │   ├── 📁 pages/        # Páginas principais
│       │   │   ├── Game.tsx           # Jogo principal
│       │   │   ├── Stats.tsx          # Estatísticas
│       │   │   ├── Options.tsx        # Configurações
│       │   │   ├── Admin.tsx          # Painel administrativo
│       │   │   └── ResetPassword.tsx  # Reset de senha
│       │   ├── 📁 services/     # Comunicação com API
│       │   │   ├── api.ts             # Cliente HTTP base
│       │   │   ├── authService.ts     # Serviços de autenticação
│       │   │   ├── statsService.ts    # Serviços de estatísticas
│       │   │   ├── wordService.ts     # Serviços de palavras
│       │   │   ├── adminService.ts    # Serviços administrativos
│       │   │   └── historyService.ts  # Serviços de histórico
│       │   ├── 📁 hooks/        # Custom hooks
│       │   │   └── useTutorial.ts     # Hook do tutorial
│       │   ├── 📁 config/       # Configurações
│       │   │   └── constants.ts       # Constantes do app
│       │   ├── 📁 utils/        # Utilitários frontend
│       │   │   ├── errorUtils.ts      # Tratamento de erros
│       │   │   └── shareUtils.ts      # Compartilhamento
│       │   └── 📁 styles/       # Estilos personalizados
│       │       └── animations.css     # Animações CSS
│       ├── package.json         # Dependências frontend
│       └── vite.config.ts       # Configuração Vite
├── 📁 docs/                     # Documentação do projeto
│   ├── 📁 Semana 1/            # Documentos da Semana 1
│   └── 📁 Semana 2/            # Documentos da Semana 2
├── package.json                 # Scripts principais do projeto
└── README.md                    # Esta documentação
```

## 🎯 Funcionalidades Principais

### Jogo Principal
- ✅ **Verbo diário de 5 letras** sorteado automaticamente
- ✅ **6 tentativas** para adivinhar o verbo
- ✅ **Feedback visual** com cores (verde/amarelo/cinza)
- ✅ **Teclado virtual** com feedback das letras já usadas
- ✅ **Modo Hard** (usa obrigatoriamente as dicas anteriores)
- ✅ **Histórico de palavras** tentadas na sessão
- ✅ **Animações e efeitos** visuais suaves
- ✅ **Responsivo** para desktop e mobile
- ✅ **Tutorial interativo** para novos jogadores
- ✅ **Validação de verbos** em tempo real

### Sistema de Usuários
- ✅ **Registro e login** completo com validação
- ✅ **Autenticação JWT** segura
- ✅ **Recuperação de senha** via email
- ✅ **Perfil de usuário** editável
- ✅ **Sincronização automática** de dados entre dispositivos
- ✅ **Troca de email** com verificação
- ✅ **Desativação/exclusão** de conta
- ✅ **Sistema de auditoria** completo

### Estatísticas e Progresso
- ✅ **Estatísticas pessoais**: vitórias, sequência, distribuição de tentativas
- ✅ **Estatísticas globais**: performance geral dos jogadores
- ✅ **Gráficos visuais** de progresso
- ✅ **Histórico completo** de jogos
- ✅ **Persistência local** e na nuvem
- ✅ **Métricas detalhadas** por período

### Sistema Administrativo Completo
- ✅ **Painel de administração** dedicado
- ✅ **Gestão de verbos** (criar, editar, ativar/desativar)
- ✅ **Gestão de usuários** (listar, ativar/desativar)
- ✅ **Sistema de auditoria** e logs detalhados
- ✅ **Estatísticas do sistema** em tempo real
- ✅ **Logs de segurança** e falhas
- ✅ **Monitoramento** de atividades suspeitas
- ✅ **Filtros e busca** avançados

### Segurança e Performance
- ✅ **Rate limiting** específico por tipo de operação
- ✅ **Validação rigorosa** de entradas (frontend e backend)
- ✅ **Headers de segurança** (Helmet)
- ✅ **CORS configurado** adequadamente
- ✅ **Sanitização** de dados de entrada
- ✅ **Error handling** centralizado e padronizado
- ✅ **Logs de auditoria** para todas as ações críticas
- ✅ **Criptografia de senhas** com bcrypt
- ✅ **Tokens JWT** com expiração

## 🛠️ Scripts Disponíveis

### Scripts Principais (raiz do projeto)
```bash
npm run dev               # Executa frontend e backend simultaneamente
npm run dev:frontend      # Executa apenas o frontend (porta 3000)
npm run dev:backend       # Executa apenas o backend (porta 5000)
npm run build            # Build do frontend para produção
npm run install:all      # Instala dependências de todos os subprojetos
```

### Scripts do Backend
```bash
cd app/backend
npm run dev              # Servidor em modo desenvolvimento (ts-node-dev)
npm run start            # Servidor em produção
npm run seed             # Popular banco com verbos iniciais
npm run test             # Executar testes
npm run build            # Compilar TypeScript
```

### Scripts do Frontend  
```bash
cd app/frontend
npm run dev              # Servidor de desenvolvimento (Vite)
npm run build            # Build para produção
npm run preview          # Preview do build de produção
npm run test             # Executar testes
npm run lint             # Verificar código com ESLint
```

## 🌐 API Endpoints

### Verbos (Jogo Principal)
- `GET /api/verb/day` - Obter verbo do dia
- `POST /api/verb/attempt` - Submeter tentativa de palavra

### Validação de Palavras
- `POST /api/words/validate` - Validar se palavra é um verbo válido
- `GET /api/words/common` - Verificar se é palavra comum

### Autenticação e Usuários
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/forgot-password` - Solicitar reset de senha
- `POST /api/auth/reset-password` - Resetar senha
- `POST /api/auth/verify-reset-token` - Verificar token de reset
- `GET /api/auth/profile` - Obter perfil do usuário
- `PUT /api/auth/profile` - Atualizar perfil
- `PUT /api/auth/change-password` - Alterar senha
- `PUT /api/auth/stats` - Atualizar estatísticas
- `POST /api/auth/history` - Adicionar entrada ao histórico
- `POST /api/auth/sync` - Sincronizar dados
- `POST /api/auth/request-email-change` - Solicitar troca de email
- `POST /api/auth/confirm-email-change` - Confirmar troca de email
- `POST /api/auth/deactivate` - Desativar conta
- `POST /api/auth/delete-account` - Excluir conta

### Administração de Verbos
- `GET /api/admin/verbs` - Listar verbos (paginado, com filtros)
- `POST /api/admin/verbs` - Criar novo verbo
- `PUT /api/admin/verbs/:id` - Atualizar verbo
- `DELETE /api/admin/verbs/:id` - Deletar verbo
- `PUT /api/admin/verbs/:id/activate` - Ativar verbo
- `GET /api/admin/stats` - Estatísticas de verbos

### Administração de Usuários e Auditoria
- `GET /api/admin-auth/stats/system` - Estatísticas do sistema
- `GET /api/admin-auth/logs` - Logs de auditoria
- `GET /api/admin-auth/logs/failures` - Logs de falhas
- `GET /api/admin-auth/logs/user/:userId` - Logs de usuário específico
- `GET /api/admin-auth/users` - Listar usuários
- `GET /api/admin-auth/users/:userId` - Detalhes de usuário
- `PATCH /api/admin-auth/users/:userId/toggle-status` - Ativar/desativar usuário

### Utilitários
- `GET /api/health` - Health check do servidor

## 🚀 Deploy e Produção

### Frontend (Vercel)
```bash
cd app/frontend
npm run build            # Gerar build de produção
# Os arquivos estarão em app/frontend/dist/
```

### Backend (Render)
```bash
# Configurar variáveis de ambiente em produção:
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
PORT=5000
JWT_SECRET=seu-jwt-secret-super-seguro-para-producao
FRONTEND_URL=https://seu-dominio.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```

### Banco de Dados (MongoDB Atlas)
1. Criar cluster no MongoDB Atlas
2. Configurar conexão segura com IP whitelist
3. Executar `npm run seed` para popular dados iniciais
4. Configurar backups automáticos

## 🤝 Contribuição

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/MinhaFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add: Minha nova feature'`)
4. **Push** para a branch (`git push origin feature/MinhaFeature`)
5. Abra um **Pull Request**

### Convenções
- **Commits**: Use prefixos `Add:`, `Fix:`, `Update:`, `Remove:`
- **TypeScript**: Sempre tipado, sem `any`
- **ESLint**: Seguir as regras configuradas
- **Componentes**: PascalCase, hooks em camelCase
- **CSS**: TailwindCSS, evitar CSS customizado

## 📋 TODO / Roadmap

### ✅ Funcionalidades Implementadas
- ✅ 🔐 Sistema completo de contas de usuário
- ✅ 📊 Sistema de estatísticas avançado
- ✅ 🔄 Sincronização automática de dados
- ✅ 🛡️ Sistema de auditoria e segurança
- ✅ 📧 Sistema de recuperação de senha
- ✅ ⚙️ Painel administrativo completo

### 🚀 Próximas Funcionalidades
- [ ] 🏆 Sistema de conquistas/badges
- [ ] 📱 Progressive Web App (PWA)
- [ ] 🌙 Modo escuro completo
- [ ] 🔄 Compartilhamento de resultados nas redes sociais
- [ ] 🎯 Múltiplos modos de jogo (verbos por categoria)
- [ ] 🔔 Sistema de notificações push
- [ ] 📈 Relatórios exportáveis para administradores

### 🎯 Melhorias Futuras
- [ ] 🚀 Otimizações de performance
- [ ] 🧪 Testes automatizados expandidos
- [ ] 🎮 Modo multiplayer/competitivo