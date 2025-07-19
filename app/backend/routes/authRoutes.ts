import express from 'express';
import { 
  AuthController, 
  validateRegister, 
  validateLogin, 
  validateAdminRegister,
  validatePasswordChange,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateProfileUpdate
} from '../controllers/authController';
import { authenticateJWT, requirePlayer, requireAdmin } from '../middleware/auth';
import { 
  loginLimiter, 
  registerLimiter, 
  passwordResetLimiter, 
  syncLimiter,
  verifyTokenLimiter 
} from '../middleware/rateLimiting';

const router = express.Router();

// Rotas públicas de autenticação com rate limiting
router.post('/register', registerLimiter, validateRegister, AuthController.registerPlayer);
router.post('/login', loginLimiter, validateLogin, AuthController.login);

// Rota para registrar admin (apenas para setup inicial - pode ser removida em produção)
router.post('/register-admin', registerLimiter, validateAdminRegister, AuthController.registerAdmin);

// Rotas de reset de senha
router.post('/request-reset', passwordResetLimiter, validatePasswordResetRequest, AuthController.requestPasswordReset);
router.post('/forgot-password', passwordResetLimiter, validatePasswordResetRequest, AuthController.forgotPassword);
router.post('/verify-reset-token', passwordResetLimiter, AuthController.verifyResetToken);
router.post('/reset-password', passwordResetLimiter, validatePasswordReset, AuthController.resetPassword);

// Rotas protegidas (requerem autenticação)
router.get('/profile', authenticateJWT, AuthController.getProfile);
router.put('/profile', authenticateJWT, requirePlayer, validateProfileUpdate, AuthController.updateProfile);
router.put('/stats', authenticateJWT, requirePlayer, AuthController.updateStats);
router.post('/history', authenticateJWT, requirePlayer, AuthController.addHistoryEntry);
router.post('/sync', syncLimiter, authenticateJWT, requirePlayer, AuthController.syncData);
router.put('/change-password', authenticateJWT, requirePlayer, validatePasswordChange, AuthController.changePassword);
router.post('/request-email-change', authenticateJWT, requirePlayer, AuthController.validateRequestEmailChange, AuthController.requestEmailChange);
router.post('/confirm-email-change', AuthController.confirmEmailChange);
router.get('/verify-email', AuthController.confirmEmailChange); // Para links diretos
router.post('/deactivate', authenticateJWT, requirePlayer, AuthController.deactivateAccount);
router.post('/delete-account', authenticateJWT, requirePlayer, AuthController.deleteAccount);

// Rota para testar configuração de email (apenas desenvolvimento)
router.get('/test-email', AuthController.testEmailConfig);

// Rota para verificar se o token é válido
router.get('/verify', verifyTokenLimiter, authenticateJWT, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

export default router;
