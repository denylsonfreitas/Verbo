import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { AuditLogger } from '../models/AuditLog';

// Extender interface do Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
    }
  }
}

// Interface para o payload do JWT
interface JWTPayload {
  userId: string;
  role: 'player' | 'admin';
  iat: number;
  exp: number;
}

// Middleware de autenticação JWT
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Buscar token no header Authorization
    const authHeader = req.headers.authorization;
    console.log('[AUTH] Authorization header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[AUTH] Token ausente ou malformado');
      res.status(401).json({
        error: 'Token de acesso requerido',
        message: 'Forneça um token válido no header Authorization'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer "
    console.log('[AUTH] Token recebido:', token);
    
    if (!process.env.JWT_SECRET) {
      console.log('[AUTH] JWT_SECRET não configurado');
      throw new Error('JWT_SECRET não configurado');
    }

    // Verificar e decodificar o token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
      console.log('[AUTH] Token decodificado:', decoded);
    } catch (err) {
      console.log('[AUTH] Erro ao decodificar token:', err);
      throw err;
    }

    // Buscar usuário no banco
    const user = await User.findById(decoded.userId);
    console.log('[AUTH] Usuário encontrado:', user ? user.username : null);
    
    if (!user || !user.isActive) {
      await AuditLogger.logInvalidToken(req, 'Usuário não encontrado ou inativo');
      res.status(401).json({
        error: 'Token inválido',
        message: 'Usuário não encontrado ou inativo'
      });
      return;
    }

    // Adicionar usuário e userId ao request
    req.user = user;
    req.userId = (user._id as any).toString();
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.log('[AUTH] JWT JsonWebTokenError:', error.message);
      await AuditLogger.logInvalidToken(req, error.message);
      res.status(401).json({
        error: 'Token inválido',
        message: 'Token malformado ou expirado'
      });
      return;
    }

    console.error('Erro na autenticação JWT:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao processar autenticação JWT'
    });
  }
};

// Middleware para verificar se o usuário é admin
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Autenticação requerida',
      message: 'Faça login para acessar este recurso'
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      error: 'Acesso negado',
      message: 'Apenas administradores podem acessar este recurso'
    });
    return;
  }

  next();
};

// Middleware para verificar se o usuário é player ou admin
export const requirePlayer = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Autenticação requerida',
      message: 'Faça login para acessar este recurso'
    });
    return;
  }

  if (!['player', 'admin'].includes(req.user.role)) {
    res.status(403).json({
      error: 'Acesso negado',
      message: 'Acesso restrito a jogadores'
    });
    return;
  }

  next();
};

// Middleware opcional de autenticação (não retorna erro se não autenticado)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Sem token, continua sem autenticação
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!process.env.JWT_SECRET) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    const user = await User.findById(decoded.userId);
    
    if (user && user.isActive) {
      req.user = user;
      req.userId = (user._id as any).toString();
    }
    
    next();
  } catch (error) {
    // Em caso de erro, continua sem autenticação
    next();
  }
};

// Utilitário para gerar JWT token
export const generateToken = (userId: string, role: 'player' | 'admin'): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET não configurado');
  }

  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' } // Token válido por 30 dias
  );
};

// Utilitário para verificar se um token é válido
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    if (!process.env.JWT_SECRET) {
      return null;
    }
    
    return jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};
