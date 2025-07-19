import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User, { IUser, IGameStats, IWordHistoryEntry } from '../models/User';
import PasswordResetToken from '../models/PasswordResetToken';
import EmailVerificationToken from '../models/EmailVerificationToken';
import { generateToken } from '../middleware/auth';
import { AuditLogger } from '../models/AuditLog';
import { emailService } from '../services/emailService';
import bcrypt from 'bcryptjs';

// Interface para dados de registro
interface RegisterData {
  username: string;
  password: string;
  email?: string;
}

// Interface para dados de login
interface LoginData {
  login: string; // pode ser username ou email
  password: string;
}

// Interface para resposta de autenticação
interface AuthResponse {
  user: IUser;
  token: string;
}

// Validações para registro
export const validateRegister = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username deve ter entre 3 e 20 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username deve conter apenas letras, números e underscore')
    .toLowerCase(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail()
];

// Validações para login
export const validateLogin = [
  body('login')
    .notEmpty()
    .withMessage('Username ou email é obrigatório')
    .toLowerCase(),
  
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
];

// Validações para admin
export const validateAdminRegister = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username deve ter entre 3 e 20 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username deve conter apenas letras, números e underscore')
    .toLowerCase(),
  
  body('email')
    .isEmail()
    .withMessage('Email é obrigatório e deve ter um formato válido')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Senha de admin deve ter pelo menos 8 caracteres')
];

// Validações para mudança de senha
export const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('Nova senha deve ser diferente da atual');
      }
      return true;
    }),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Confirmação de senha não confere');
      }
      return true;
    })
];

// Validações para solicitação de reset de senha
export const validatePasswordResetRequest = [
  body('email')
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail()
];

// Validações para reset de senha
export const validatePasswordReset = [
  body('token')
    .notEmpty()
    .withMessage('Token é obrigatório'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
];

// Validações para atualização de perfil
export const validateProfileUpdate = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail(),
  
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username deve ter entre 3 e 20 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username deve conter apenas letras, números e underscore')
    .toLowerCase()
];

export class AuthController {
  // Registrar novo jogador
  static async registerPlayer(req: Request, res: Response): Promise<void> {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Dados inválidos',
          message: 'Verifique os dados fornecidos',
          details: errors.array()
        });
        return;
      }

      const { username, password, email }: RegisterData = req.body;

      // Verificar se username já existe
      const existingUser = await User.findOne({ 
        username: username.toLowerCase() 
      });

      if (existingUser) {
        res.status(409).json({
          error: 'Username já existe',
          message: 'Escolha um username diferente'
        });
        return;
      }

      // Verificar se email já existe (se fornecido)
      if (email) {
        const existingEmail = await User.findOne({ 
          email: email.toLowerCase() 
        });

        if (existingEmail) {
          res.status(409).json({
            error: 'Email já cadastrado',
            message: 'Este email já está em uso'
          });
          return;
        }
      }

      // Criar novo usuário
      const user = await User.createPlayer(username, password, email);
      const token = generateToken((user._id as any).toString(), user.role);

      // Log do registro
      await AuditLogger.logRegistration(req, user);

      res.status(201).json({
        message: 'Jogador registrado com sucesso',
        user,
        token
      });

    } catch (error) {
      console.error('Erro ao registrar jogador:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao criar conta'
      });
    }
  }

  // Login de usuário
  static async login(req: Request, res: Response): Promise<void> {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Dados inválidos',
          message: 'Verifique os dados fornecidos',
          details: errors.array()
        });
        return;
      }

      const { login, password }: LoginData = req.body;

      // Buscar usuário por credenciais
      const user = await User.findByCredentials(login, password);

      if (!user) {
        await AuditLogger.logFailedLogin(req, login);
        res.status(401).json({
          error: 'Credenciais inválidas',
          message: 'Username/email ou senha incorretos'
        });
        return;
      }

      // Gerar token
      const token = generateToken((user._id as any).toString(), user.role);

      // Log do login bem-sucedido
      await AuditLogger.logLogin(req, user);

      res.json({
        message: 'Login realizado com sucesso',
        user,
        token
      });

    } catch (error) {
      console.error('Erro ao fazer login:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao processar login'
      });
    }
  }

  // Registrar novo admin (apenas para desenvolvimento/setup inicial)
  static async registerAdmin(req: Request, res: Response): Promise<void> {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Dados inválidos',
          message: 'Verifique os dados fornecidos',
          details: errors.array()
        });
        return;
      }

      const { username, email, password } = req.body;

      // Verificar se username já existe
      const existingUser = await User.findOne({ 
        username: username.toLowerCase() 
      });

      if (existingUser) {
        res.status(409).json({
          error: 'Username já existe',
          message: 'Escolha um username diferente'
        });
        return;
      }

      // Verificar se email já existe
      const existingEmail = await User.findOne({ 
        email: email.toLowerCase() 
      });

      if (existingEmail) {
        res.status(409).json({
          error: 'Email já cadastrado',
          message: 'Este email já está em uso'
        });
        return;
      }

      // Criar novo admin
      const user = await User.createAdmin(username, email, password);
      const token = generateToken((user._id as any).toString(), user.role);

      res.status(201).json({
        message: 'Administrador registrado com sucesso',
        user,
        token
      });

    } catch (error) {
      console.error('Erro ao registrar admin:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao criar conta de administrador'
      });
    }
  }

  // Obter perfil do usuário autenticado
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Não autenticado',
          message: 'Faça login para acessar o perfil'
        });
        return;
      }

      res.json({
        user: req.user
      });

    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao carregar perfil'
      });
    }
  }

  // Atualizar estatísticas do usuário
  static async updateStats(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Não autenticado',
          message: 'Faça login para salvar estatísticas'
        });
        return;
      }

      const { stats }: { stats: IGameStats } = req.body;

      // Validar estrutura das estatísticas
      if (!stats || typeof stats !== 'object') {
        res.status(400).json({
          error: 'Dados inválidos',
          message: 'Estrutura de estatísticas inválida'
        });
        return;
      }

      // Atualizar estatísticas do usuário
      req.user.stats = stats;
      await req.user.save();

      // Log da atualização
      await AuditLogger.logStatsUpdate(req);

      res.json({
        message: 'Estatísticas atualizadas com sucesso',
        stats: req.user.stats
      });

    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
      await AuditLogger.logFailure('stats_update', '/api/auth/stats', req, 'Erro interno do servidor');
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao salvar estatísticas'
      });
    }
  }

  // Adicionar entrada ao histórico
  static async addHistoryEntry(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Não autenticado',
          message: 'Faça login para salvar histórico'
        });
        return;
      }

      const { entry }: { entry: IWordHistoryEntry } = req.body;

      // Validar entrada do histórico
      if (!entry || typeof entry !== 'object') {
        res.status(400).json({
          error: 'Dados inválidos',
          message: 'Entrada de histórico inválida'
        });
        return;
      }

      // Adicionar ao histórico
      req.user.gameHistory.push(entry);
      await req.user.save();

      res.json({
        message: 'Entrada adicionada ao histórico',
        historyCount: req.user.gameHistory.length
      });

    } catch (error) {
      console.error('Erro ao adicionar ao histórico:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao salvar no histórico'
      });
    }
  }

  // Sincronizar dados locais com servidor
  static async syncData(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Não autenticado',
          message: 'Faça login para sincronizar dados'
        });
        return;
      }

      const { stats, gameHistory }: { 
        stats: IGameStats; 
        gameHistory: IWordHistoryEntry[] 
      } = req.body;

      // Mesclar estatísticas (mantém os melhores valores)
      if (stats) {
        const currentStats = req.user.stats;
        const mergedStats: IGameStats = {
          gamesPlayed: Math.max(currentStats.gamesPlayed, stats.gamesPlayed),
          gamesWon: Math.max(currentStats.gamesWon, stats.gamesWon),
          currentStreak: Math.max(currentStats.currentStreak, stats.currentStreak),
          maxStreak: Math.max(currentStats.maxStreak, stats.maxStreak),
          guessDistribution: {
            1: Math.max(currentStats.guessDistribution[1], stats.guessDistribution[1]),
            2: Math.max(currentStats.guessDistribution[2], stats.guessDistribution[2]),
            3: Math.max(currentStats.guessDistribution[3], stats.guessDistribution[3]),
            4: Math.max(currentStats.guessDistribution[4], stats.guessDistribution[4]),
            5: Math.max(currentStats.guessDistribution[5], stats.guessDistribution[5]),
            6: Math.max(currentStats.guessDistribution[6], stats.guessDistribution[6]),
          },
          lastPlayedDate: stats.lastPlayedDate || currentStats.lastPlayedDate,
          lastWonDate: stats.lastWonDate || currentStats.lastWonDate
        };
        
        req.user.stats = mergedStats;
      }

      // Mesclar histórico (evita duplicatas por data)
      let newEntries: IWordHistoryEntry[] = [];
      if (gameHistory && Array.isArray(gameHistory)) {
        const existingDates = new Set(req.user.gameHistory.map(entry => entry.date));
        
        // Filtrar entradas válidas (com verbId) e que não existem ainda
        const validEntries = gameHistory.filter(entry => {
          // Verificar se tem verbId (obrigatório)
          if (!entry.verbId) {
            console.warn(`Entrada do histórico sem verbId ignorada:`, entry);
            return false;
          }
          // Verificar se não existe ainda
          return !existingDates.has(entry.date);
        });
        
        newEntries = validEntries;
        req.user.gameHistory.push(...newEntries);
      }

      await req.user.save();

      // Log da sincronização
      await AuditLogger.logDataSync(req, {
        statsUpdated: !!stats,
        historyEntriesAdded: newEntries?.length || 0,
        totalHistoryEntries: req.user.gameHistory.length
      });

      res.json({
        message: 'Dados sincronizados com sucesso',
        user: req.user
      });

    } catch (error) {
      console.error('Erro ao sincronizar dados:', error);
      await AuditLogger.logFailure('data_sync', '/api/auth/sync', req, 'Erro interno do servidor');
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao sincronizar dados'
      });
    }
  }

  // Alterar senha do usuário autenticado
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Não autenticado',
          message: 'Faça login para alterar a senha'
        });
        return;
      }

      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Dados inválidos',
          message: 'Verifique os dados fornecidos',
          details: errors.array()
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      // Verificar senha atual
      const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        await AuditLogger.logFailure('password_change', '/api/auth/change-password', req, 'Senha atual incorreta');
        res.status(400).json({
          error: 'Senha incorreta',
          message: 'Senha atual não confere'
        });
        return;
      }

      // Atualizar senha
      req.user.password = newPassword;
      await req.user.save();

      await AuditLogger.logSuccess('password_change', '/api/auth/change-password', req);

      res.json({
        message: 'Senha alterada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      await AuditLogger.logFailure('password_change', '/api/auth/change-password', req, 'Erro interno do servidor');
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao alterar senha'
      });
    }
  }

  // Solicitar reset de senha
  static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Dados inválidos',
          message: 'Verifique os dados fornecidos',
          details: errors.array()
        });
        return;
      }

      const { email } = req.body;

      // Buscar usuário por email
      const user = await User.findOne({ 
        email: email.toLowerCase(),
        isActive: true 
      });

      // Sempre retorna sucesso por segurança (não revela se email existe)
      res.json({
        message: 'Se o email estiver cadastrado, você receberá instruções para reset'
      });

      // Se usuário não existe, não faz nada mais
      if (!user) {
        await AuditLogger.logFailure('password_reset_request', '/api/auth/request-reset', req, 'Email não encontrado', { email });
        return;
      }

      // Gerar token de reset
      const resetToken = await (PasswordResetToken as any).generateToken((user._id as any).toString());

      // Enviar email de recuperação de senha
      if (emailService.isConfigured()) {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const emailTemplate = emailService.generatePasswordResetEmail(
          user.username,
          resetToken.token,
          baseUrl
        );

        const emailSent = await emailService.sendEmail({
          to: user.email!,
          subject: emailTemplate.subject,
          html: emailTemplate.html
        });

        if (emailSent) {
          console.log(`Email de recuperação enviado para ${user.email}`);
        } else {
          console.log(`Falha ao enviar email para ${user.email}, mas token gerado: ${resetToken.token}`);
        }
      } else {
        console.log(`Configuração de email não definida. Reset token para ${email}: ${resetToken.token}`);
      }

      await AuditLogger.logSuccess('password_reset_request', '/api/auth/request-reset', req, {
        userId: user._id,
        email: user.email,
        tokenId: resetToken._id
      });

    } catch (error) {
      console.error('Erro ao solicitar reset de senha:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao processar solicitação'
      });
    }
  }

  // Solicitar reset de senha
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Dados inválidos',
          message: 'Verifique os dados fornecidos',
          details: errors.array()
        });
        return;
      }

      const { email } = req.body;

      // Buscar usuário pelo email
      const user = await User.findOne({ email: email.toLowerCase() });
      
      // Por segurança, sempre retornamos sucesso, mesmo se o email não existir
      if (!user) {
        res.status(200).json({
          message: 'Se o email existir em nossa base, você receberá um link de recuperação',
          success: true
        });
        return;
      }

      // Verificar se o usuário está ativo
      if (!user.isActive) {
        res.status(200).json({
          message: 'Se o email existir em nossa base, você receberá um link de recuperação',
          success: true
        });
        return;
      }

      // Gerar token de reset
      const resetToken = await PasswordResetToken.generateToken((user._id as any).toString());
      
      // Enviar email de recuperação de senha
      if (emailService.isConfigured()) {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const emailTemplate = emailService.generatePasswordResetEmail(
          user.username,
          resetToken.token,
          baseUrl
        );

        const emailSent = await emailService.sendEmail({
          to: user.email!,
          subject: emailTemplate.subject,
          html: emailTemplate.html
        });

        if (emailSent) {
          console.log(`Email de recuperação enviado para ${user.email}`);
        } else {
          console.log(`Falha ao enviar email para ${user.email}, mas token gerado: ${resetToken.token}`);
        }
      } else {
        console.log(`Configuração de email não definida. Reset token para ${email}: ${resetToken.token}`);
      }

      // Log da ação
      await AuditLogger.logPasswordResetRequest(req, email);

      res.status(200).json({
        message: 'Se o email existir em nossa base, você receberá um link de recuperação',
        success: true
      });

    } catch (error) {
      console.error('Erro ao solicitar reset de senha:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao processar solicitação'
      });
    }
  }

  // Verificar se token de reset é válido
  static async verifyResetToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          error: 'Token obrigatório',
          message: 'Token de reset é obrigatório'
        });
        return;
      }

      // Buscar token válido no banco
      const resetToken = await PasswordResetToken.findOne({
        token,
        used: false,
        expiresAt: { $gt: new Date() }
      });

      res.json({
        valid: !!resetToken
      });

    } catch (error) {
      console.error('Erro ao verificar token de reset:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao verificar token'
      });
    }
  }

  // Resetar senha com token
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Dados inválidos',
          message: 'Verifique os dados fornecidos',
          details: errors.array()
        });
        return;
      }

      const { token, newPassword } = req.body;

      // Validar token
      const resetToken = await (PasswordResetToken as any).validateToken(token);
      if (!resetToken) {
        await AuditLogger.logFailure('password_reset', '/api/auth/reset-password', req, 'Token inválido ou expirado');
        res.status(400).json({
          error: 'Token inválido',
          message: 'Token inválido ou expirado'
        });
        return;
      }

      // Buscar usuário
      const user = await User.findById(resetToken.userId);
      if (!user || !user.isActive) {
        await AuditLogger.logFailure('password_reset', '/api/auth/reset-password', req, 'Usuário não encontrado');
        res.status(400).json({
          error: 'Usuário não encontrado',
          message: 'Usuário inválido'
        });
        return;
      }

      // Atualizar senha
      user.password = newPassword;
      await user.save();

      // Marcar token como usado
      await resetToken.markAsUsed();

      await AuditLogger.logSuccess('password_reset', '/api/auth/reset-password', req, {
        userId: user._id,
        username: user.username
      });

      res.json({
        message: 'Senha resetada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      await AuditLogger.logFailure('password_reset', '/api/auth/reset-password', req, 'Erro interno do servidor');
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao resetar senha'
      });
    }
  }

  // Atualizar perfil do usuário
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Não autenticado',
          message: 'Faça login para atualizar o perfil'
        });
        return;
      }

      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Dados inválidos',
          message: 'Verifique os dados fornecidos',
          details: errors.array()
        });
        return;
      }

      const { email, username } = req.body;
      const updates: any = {};

      // Atualizar email se fornecido
      if (email && email !== req.user.email) {
        // Verificar se email já existe
        const existingEmail = await User.findOne({ 
          email: email.toLowerCase(),
          _id: { $ne: req.user._id }
        });

        if (existingEmail) {
          res.status(409).json({
            error: 'Email já em uso',
            message: 'Este email já está sendo usado por outro usuário'
          });
          return;
        }

        updates.email = email.toLowerCase();
      }

      // Atualizar username se fornecido
      if (username && username !== req.user.username) {
        // Verificar se username já existe
        const existingUsername = await User.findOne({ 
          username: username.toLowerCase(),
          _id: { $ne: req.user._id }
        });

        if (existingUsername) {
          res.status(409).json({
            error: 'Username já em uso',
            message: 'Este username já está sendo usado'
          });
          return;
        }

        updates.username = username.toLowerCase();
      }

      // Se não há mudanças, retorna sucesso
      if (Object.keys(updates).length === 0) {
        res.json({
          message: 'Perfil já está atualizado',
          user: req.user
        });
        return;
      }

      // Aplicar atualizações
      Object.assign(req.user, updates);
      await req.user.save();

      await AuditLogger.logSuccess('profile_update', '/api/auth/profile', req, updates);

      res.json({
        message: 'Perfil atualizado com sucesso',
        user: req.user
      });

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      await AuditLogger.logFailure('profile_update', '/api/auth/profile', req, 'Erro interno do servidor');
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao atualizar perfil'
      });
    }
  }

  // Desativar conta do usuário
  static async deactivateAccount(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Não autenticado',
          message: 'Faça login para desativar a conta'
        });
        return;
      }

      // Verificar senha para confirmação
      const { password } = req.body;
      if (!password) {
        res.status(400).json({
          error: 'Senha requerida',
          message: 'Digite sua senha para confirmar a desativação'
        });
        return;
      }

      const isPasswordValid = await req.user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(400).json({
          error: 'Senha incorreta',
          message: 'Senha não confere'
        });
        return;
      }

      // Desativar conta
      req.user.isActive = false;
      await req.user.save();

      await AuditLogger.logSuccess('account_deactivation', '/api/auth/deactivate', req, {
        userId: req.user._id,
        username: req.user.username
      });

      res.json({
        message: 'Conta desativada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao desativar conta:', error);
      await AuditLogger.logFailure('account_deactivation', '/api/auth/deactivate', req, 'Erro interno do servidor');
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao desativar conta'
      });
    }
  }

  // Excluir conta permanentemente
  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Não autorizado',
          message: 'Faça login para excluir a conta'
        });
        return;
      }

      const { password } = req.body;

      // Validar se a senha foi fornecida
      if (!password) {
        res.status(400).json({
          error: 'Senha obrigatória',
          message: 'Digite sua senha para confirmar a exclusão'
        });
        return;
      }

      const userId = req.user._id;

      // Verificar se é um admin tentando excluir a própria conta
      if (req.user.role === 'admin') {
        await AuditLogger.logFailure('account_deletion', '/api/auth/delete-account', req, 'Administradores não podem excluir suas contas');
        res.status(403).json({
          error: 'Acesso negado',
          message: 'Administradores não podem excluir suas próprias contas'
        });
        return;
      }

      // Buscar o usuário para verificar a senha
      const user = await User.findById(userId);
      if (!user) {
        await AuditLogger.logFailure('account_deletion', '/api/auth/delete-account', req, 'Usuário não encontrado');
        res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'Conta não encontrada'
        });
        return;
      }

      // Verificar se a senha está correta
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        await AuditLogger.logFailure('account_deletion', '/api/auth/delete-account', req, 'Senha incorreta');
        res.status(400).json({
          error: 'Senha incorreta',
          message: 'A senha digitada está incorreta'
        });
        return;
      }

      // Excluir completamente o usuário do banco de dados
      const deletedUser = await User.findByIdAndDelete(userId);

      if (!deletedUser) {
        await AuditLogger.logFailure('account_deletion', '/api/auth/delete-account', req, 'Usuário não encontrado');
        res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'Conta não encontrada'
        });
        return;
      }

      // Log da exclusão bem-sucedida
      await AuditLogger.logSuccess('account_deletion', '/api/auth/delete-account', req, {
        userId: (userId as any).toString(),
        username: req.user.username
      });

      res.json({
        message: 'Conta excluída permanentemente com sucesso'
      });

    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      await AuditLogger.logFailure('account_deletion', '/api/auth/delete-account', req, 'Erro interno do servidor');
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao excluir conta'
      });
    }
  }

  // Validações para solicitar mudança de email
  static validateRequestEmailChange = [
    body('newEmail')
      .notEmpty()
      .withMessage('Novo email é obrigatório')
      .isEmail()
      .withMessage('Novo email deve ter um formato válido')
      .normalizeEmail(),
  ];

  // Solicitar mudança de email (envia token de verificação)
  static async requestEmailChange(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Dados inválidos',
          message: 'Verifique os dados fornecidos',
          details: errors.array()
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          error: 'Não autorizado',
          message: 'Faça login para alterar o email'
        });
        return;
      }

      const { newEmail } = req.body;
      const userId = req.user._id;

      // Verificar se o novo email já está em uso
      const existingUser = await User.findOne({ email: newEmail });
      if (existingUser && (existingUser._id as any).toString() !== (userId as any).toString()) {
        res.status(400).json({
          error: 'Email já em uso',
          message: 'Este email já está sendo usado por outra conta'
        });
        return;
      }

      // Verificar se não é o mesmo email atual
      if (req.user.email === newEmail) {
        res.status(400).json({
          error: 'Email inválido',
          message: 'O novo email deve ser diferente do atual'
        });
        return;
      }

      // Gerar token de verificação
      const verificationToken = await EmailVerificationToken.generateToken((userId as any).toString(), newEmail);

      // Enviar email de verificação
      if (emailService.isConfigured()) {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const emailTemplate = emailService.generateEmailVerificationEmail(
          req.user.username,
          newEmail,
          verificationToken.token,
          baseUrl
        );

        const emailSent = await emailService.sendEmail({
          to: newEmail,
          subject: emailTemplate.subject,
          html: emailTemplate.html
        });

        if (emailSent) {
          console.log(`Email de verificação enviado para ${newEmail}`);
        } else {
          console.log(`Falha ao enviar email para ${newEmail}, mas token gerado: ${verificationToken.token}`);
        }
      } else {
        console.log(`Configuração de email não definida. Verification token para ${newEmail}: ${verificationToken.token}`);
      }
      
      await AuditLogger.logSuccess('email_change_request', '/api/auth/request-email-change', req, {
        userId: (userId as any).toString(),
        currentEmail: req.user.email,
        newEmail: newEmail
      });

      res.json({
        message: 'Link de verificação enviado para o novo email. Verifique sua caixa de entrada.',
        // Remover o token da response em produção se email estiver configurado
        ...(emailService.isConfigured() ? {} : { verificationToken: verificationToken.token })
      });

    } catch (error) {
      console.error('Erro ao solicitar mudança de email:', error);
      await AuditLogger.logFailure('email_change_request', '/api/auth/request-email-change', req, 'Erro interno do servidor');
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao processar solicitação'
      });
    }
  }

  // Confirmar mudança de email com token
  static async confirmEmailChange(req: Request, res: Response): Promise<void> {
    try {
      // Aceitar token do body (POST) ou query parameter (GET)
      const token = req.body.token || req.query.token;

      if (!token) {
        res.status(400).json({
          error: 'Token obrigatório',
          message: 'Token de verificação é obrigatório'
        });
        return;
      }

      // Validar o token
      const verificationToken = await EmailVerificationToken.validateToken(token);
      if (!verificationToken) {
        res.status(400).json({
          error: 'Token inválido',
          message: 'Token de verificação inválido ou expirado'
        });
        return;
      }

      // Buscar o usuário
      const user = await User.findById(verificationToken.userId);
      if (!user) {
        res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'Usuário não encontrado'
        });
        return;
      }

      // Verificar se o novo email ainda não está em uso
      const existingUser = await User.findOne({ email: verificationToken.newEmail });
      if (existingUser && (existingUser._id as any).toString() !== (user._id as any).toString()) {
        res.status(400).json({
          error: 'Email já em uso',
          message: 'Este email já está sendo usado por outra conta'
        });
        return;
      }

      // Atualizar o email do usuário
      const oldEmail = user.email;
      user.email = verificationToken.newEmail;
      await user.save();

      // Marcar o token como usado
      await verificationToken.markAsUsed();

      await AuditLogger.logSuccess('email_change_confirm', '/api/auth/confirm-email-change', req, {
        userId: (user._id as any).toString(),
        oldEmail: oldEmail,
        newEmail: user.email
      });

      // Buscar o usuário completo com todas as propriedades
      const fullUser = await User.findById(user._id).select('-password');

      res.json({
        message: 'Email alterado com sucesso',
        user: fullUser
      });

    } catch (error) {
      console.error('Erro ao confirmar mudança de email:', error);
      await AuditLogger.logFailure('email_change_confirm', '/api/auth/confirm-email-change', req, 'Erro interno do servidor');
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao confirmar mudança de email'
      });
    }
  }

  // Testar configuração de email (apenas para desenvolvimento)
  static async testEmailConfig(req: Request, res: Response): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'production') {
        res.status(403).json({
          error: 'Acesso negado',
          message: 'Esta funcionalidade não está disponível em produção'
        });
        return;
      }

      const isConfigured = emailService.isConfigured();
      
      if (!isConfigured) {
        res.json({
          configured: false,
          message: 'Configuração de email não definida. Defina as variáveis SMTP_USER e SMTP_PASS no .env'
        });
        return;
      }

      const connectionTest = await emailService.testConnection();
      
      res.json({
        configured: true,
        connectionWorking: connectionTest,
        message: connectionTest 
          ? 'Configuração de email funcionando corretamente' 
          : 'Configuração de email definida, mas conexão falhando'
      });

    } catch (error) {
      console.error('Erro ao testar configuração de email:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao testar configuração de email'
      });
    }
  }
}
