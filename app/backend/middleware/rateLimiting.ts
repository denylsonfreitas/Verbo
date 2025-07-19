import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Rate limiting para tentativas de login
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 tentativas por IP em 15 minutos
  message: {
    error: 'Muitas tentativas de login',
    message: 'Tente novamente em 15 minutos',
    retryAfter: '15 minutos'
  },
  standardHeaders: true, // Retorna headers `RateLimit-*` 
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Limite de tentativas excedido',
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      retryAfter: Math.ceil(15 * 60), // segundos
      timestamp: new Date().toISOString()
    });
  }
});

// Rate limiting para registro de usuários
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Máximo 3 registros por IP por hora
  message: {
    error: 'Limite de registros excedido',
    message: 'Máximo 3 registros por hora. Tente novamente mais tarde.',
    retryAfter: '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Limite de registros excedido',
      message: 'Máximo 3 registros por hora por IP. Tente novamente mais tarde.',
      retryAfter: Math.ceil(60 * 60), // segundos
      timestamp: new Date().toISOString()
    });
  }
});

// Rate limiting para reset de senha
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos (reduzido de 1 hora)
  max: 10, // Máximo 10 tentativas de reset por IP em 15 minutos (aumentado de 3)
  message: {
    error: 'Limite de reset de senha excedido',
    message: 'Máximo 10 tentativas de reset por 15 minutos.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para operações de sincronização
export const syncLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // Máximo 10 sincronizações por usuário em 5 minutos
  keyGenerator: (req: Request) => {
    // Usar userId se autenticado, senão IP
    return req.userId || req.ip || 'unknown';
  },
  message: {
    error: 'Muitas sincronizações',
    message: 'Aguarde alguns minutos antes de sincronizar novamente.',
    retryAfter: '5 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para verificação de token
export const verifyTokenLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 verificações por minuto por IP
  message: {
    error: 'Muitas verificações de token',
    message: 'Aguarde antes de tentar novamente.',
    retryAfter: '1 minuto'
  },
  standardHeaders: true,
  legacyHeaders: false
});
