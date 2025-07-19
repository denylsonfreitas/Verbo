import express, { Request, Response } from 'express';
import { authenticateJWT, requireAdmin } from '../middleware/auth';
import { AuditLogger } from '../models/AuditLog';
import User from '../models/User';
import { param, query, validationResult } from 'express-validator';

const router = express.Router();

// Middleware para todas as rotas admin
router.use(authenticateJWT);
router.use(requireAdmin);

// Validações para consultas
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número maior que 0'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser entre 1 e 100'),
  
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Dias deve ser entre 1 e 365')
];

const validateUserId = [
  param('userId')
    .isMongoId()
    .withMessage('ID de usuário inválido')
];

// Estatísticas gerais do sistema
router.get('/stats/system', validatePagination, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Parâmetros inválidos',
        details: errors.array()
      });
      return;
    }

    const days = parseInt(req.query.days as string) || 7;

    // Estatísticas de usuários
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const players = await User.countDocuments({ role: 'player' });
    const admins = await User.countDocuments({ role: 'admin' });

    // Usuários recentes
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - days);
    const recentUsers = await User.countDocuments({ 
      createdAt: { $gte: recentDate } 
    });

    // Estatísticas de segurança
    const securityStats = await AuditLogger.getSecurityStats(days);

    await AuditLogger.logAdminAccess(req, '/api/admin-auth/stats/system');

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        players,
        admins,
        recentRegistrations: recentUsers
      },
      security: securityStats,
      period: `${days} dias`
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas do sistema:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao carregar estatísticas'
    });
  }
});

// Logs de auditoria gerais
router.get('/logs', validatePagination, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Parâmetros inválidos',
        details: errors.array()
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const logs = await AuditLogger.getActionLogs('', limit, skip);
    
    await AuditLogger.logAdminAccess(req, '/api/admin-auth/logs');

    res.json({
      logs,
      pagination: {
        page,
        limit,
        hasMore: logs.length === limit
      }
    });

  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao carregar logs'
    });
  }
});

// Logs de falhas de segurança
router.get('/logs/failures', validatePagination, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Parâmetros inválidos',
        details: errors.array()
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const failureLogs = await AuditLogger.getFailureLogs(limit, skip);
    
    await AuditLogger.logAdminAccess(req, '/api/admin-auth/logs/failures');

    res.json({
      logs: failureLogs,
      pagination: {
        page,
        limit,
        hasMore: failureLogs.length === limit
      }
    });

  } catch (error) {
    console.error('Erro ao buscar logs de falhas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao carregar logs de falhas'
    });
  }
});

// Logs de um usuário específico
router.get('/logs/user/:userId', validateUserId, validatePagination, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Parâmetros inválidos',
        details: errors.array()
      });
      return;
    }

    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Verificar se usuário existe
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        error: 'Usuário não encontrado',
        message: 'ID de usuário inválido'
      });
      return;
    }

    const userLogs = await AuditLogger.getUserLogs(userId, limit, skip);
    
    await AuditLogger.logAdminAccess(req, `/api/admin-auth/logs/user/${userId}`);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      },
      logs: userLogs,
      pagination: {
        page,
        limit,
        hasMore: userLogs.length === limit
      }
    });

  } catch (error) {
    console.error('Erro ao buscar logs do usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao carregar logs do usuário'
    });
  }
});

// Listar usuários com filtros
router.get('/users', validatePagination, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Parâmetros inválidos',
        details: errors.array()
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const { role, active, search } = req.query;

    // Construir filtro
    const filter: any = {};
    
    if (role && ['player', 'admin'].includes(role as string)) {
      filter.role = role;
    }
    
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await User.countDocuments(filter);
    
    await AuditLogger.logAdminAccess(req, '/api/admin-auth/users');

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + users.length < total
      }
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao carregar usuários'
    });
  }
});

// Detalhes de um usuário específico
router.get('/users/:userId', validateUserId, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Parâmetros inválidos',
        details: errors.array()
      });
      return;
    }

    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({
        error: 'Usuário não encontrado',
        message: 'ID de usuário inválido'
      });
      return;
    }

    await AuditLogger.logAdminAccess(req, `/api/admin-auth/users/${userId}`);

    res.json({ user });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao carregar usuário'
    });
  }
});

// Desativar/ativar usuário
router.patch('/users/:userId/toggle-status', validateUserId, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Parâmetros inválidos',
        details: errors.array()
      });
      return;
    }

    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        error: 'Usuário não encontrado',
        message: 'ID de usuário inválido'
      });
      return;
    }

    // Não permitir desativar o próprio usuário
    if (userId === req.userId) {
      res.status(400).json({
        error: 'Operação não permitida',
        message: 'Não é possível desativar sua própria conta'
      });
      return;
    }

    const previousStatus = user.isActive;
    user.isActive = !user.isActive;
    await user.save();

    await AuditLogger.logSuccess(
      user.isActive ? 'user_activation' : 'user_deactivation',
      `/api/admin-auth/users/${userId}/toggle-status`,
      req,
      {
        targetUserId: userId,
        targetUsername: user.username,
        previousStatus,
        newStatus: user.isActive
      }
    );

    res.json({
      message: `Usuário ${user.isActive ? 'ativado' : 'desativado'} com sucesso`,
      user: {
        id: user._id,
        username: user.username,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Erro ao alterar status do usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao alterar status do usuário'
    });
  }
});

export default router;
