import mongoose, { Document, Schema } from 'mongoose';

// Interface para logs de auditoria
export interface IAuditLog extends Document {
  userId?: string;
  username?: string;
  action: string;
  resource: string;
  details?: any;
  ip: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
}

// Schema para logs de auditoria
const auditLogSchema = new Schema<IAuditLog>({
  userId: {
    type: String,
    ref: 'User'
  },
  username: {
    type: String
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout', 
      'register',
      'password_change',
      'password_reset_request',
      'password_reset',
      'password_reset_confirm',
      'profile_update',
      'email_change_request',
      'email_change_confirm',
      'stats_update',
      'data_sync',
      'admin_access',
      'admin_creation',
      'token_refresh',
      'account_deactivation',
      'account_deletion',
      'failed_login',
      'invalid_token'
    ]
  },
  resource: {
    type: String,
    required: true
  },
  details: {
    type: Schema.Types.Mixed, // Dados adicionais da ação
    default: null
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  success: {
    type: Boolean,
    required: true
  },
  errorMessage: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  // Configurações do schema
  timestamps: false, // Usamos timestamp customizado
  collection: 'audit_logs'
});

// Índices organizados para evitar duplicação
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ username: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ resource: 1 });
auditLogSchema.index({ ip: 1 });
auditLogSchema.index({ success: 1 });

// Índices compostos para consultas eficientes
auditLogSchema.index({ timestamp: -1, success: 1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ ip: 1, timestamp: -1 });

// TTL - Remove logs após 90 dias automaticamente
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

// Funções utilitárias para logging
export class AuditLogger {
  
  // Log de ação bem-sucedida
  static async logSuccess(
    action: string,
    resource: string,
    req: any,
    details?: any
  ): Promise<void> {
    try {
      await AuditLog.create({
        userId: req.userId,
        username: req.user?.username,
        action,
        resource,
        details,
        ip: this.getClientIP(req),
        userAgent: req.get('User-Agent'),
        success: true,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Erro ao registrar log de sucesso:', error);
    }
  }

  // Log de ação com falha
  static async logFailure(
    action: string,
    resource: string,
    req: any,
    errorMessage: string,
    details?: any
  ): Promise<void> {
    try {
      await AuditLog.create({
        userId: req.userId,
        username: req.user?.username,
        action,
        resource,
        details,
        ip: this.getClientIP(req),
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Erro ao registrar log de falha:', error);
    }
  }

  // Log de login bem-sucedido
  static async logLogin(req: any, user: any): Promise<void> {
    await this.logSuccess('login', '/api/auth/login', req, {
      userId: user._id,
      username: user.username,
      role: user.role
    });
  }

  // Log de login falhado
  static async logFailedLogin(req: any, loginAttempt: string): Promise<void> {
    await this.logFailure('failed_login', '/api/auth/login', req, 'Credenciais inválidas', {
      loginAttempt
    });
  }

  // Log de registro de usuário
  static async logRegistration(req: any, user: any): Promise<void> {
    await this.logSuccess('register', '/api/auth/register', req, {
      userId: user._id,
      username: user.username,
      role: user.role,
      hasEmail: !!user.email
    });
  }

  // Log de sincronização de dados
  static async logDataSync(req: any, syncDetails: any): Promise<void> {
    await this.logSuccess('data_sync', '/api/auth/sync', req, syncDetails);
  }

  // Log de atualização de estatísticas
  static async logStatsUpdate(req: any): Promise<void> {
    await this.logSuccess('stats_update', '/api/auth/stats', req, {
      userId: req.userId
    });
  }

  // Log de acesso admin
  static async logAdminAccess(req: any, resource: string): Promise<void> {
    await this.logSuccess('admin_access', resource, req, {
      adminId: req.userId,
      adminUsername: req.user?.username
    });
  }

  // Log de token inválido
  static async logInvalidToken(req: any, error: string): Promise<void> {
    await this.logFailure('invalid_token', req.originalUrl || 'unknown', req, error);
  }

  // Log de solicitação de reset de senha
  static async logPasswordResetRequest(req: any, email: string): Promise<void> {
    await this.logSuccess('password_reset_request', '/api/auth/forgot-password', req, { email });
  }

  // Obter IP do cliente (considerando proxies)
  private static getClientIP(req: any): string {
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.headers['x-forwarded-for']?.split(',')[0] ||
           'unknown';
  }

  // Buscar logs por usuário
  static async getUserLogs(
    userId: string, 
    limit: number = 50,
    skip: number = 0
  ): Promise<IAuditLog[]> {
    return AuditLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
  }

  // Buscar logs por ação
  static async getActionLogs(
    action: string,
    limit: number = 100,
    skip: number = 0
  ): Promise<IAuditLog[]> {
    return AuditLog.find({ action })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
  }

  // Buscar logs com falha
  static async getFailureLogs(
    limit: number = 100,
    skip: number = 0
  ): Promise<IAuditLog[]> {
    return AuditLog.find({ success: false })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
  }

  // Estatísticas de segurança
  static async getSecurityStats(days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          failures: {
            $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] }
          },
          successes: {
            $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return stats;
  }
}

export default AuditLog;
