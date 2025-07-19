import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

// Interface para tokens de reset de senha
export interface IPasswordResetToken extends Document {
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  markAsUsed(): Promise<IPasswordResetToken>;
}

// Interface para métodos estáticos
export interface IPasswordResetTokenModel extends mongoose.Model<IPasswordResetToken> {
  generateToken(userId: string): Promise<IPasswordResetToken>;
  validateToken(token: string): Promise<IPasswordResetToken | null>;
}

// Schema para tokens de reset
const passwordResetTokenSchema = new Schema<IPasswordResetToken>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Índices para performance e TTL (token já tem índice único automático)
passwordResetTokenSchema.index({ userId: 1 });
passwordResetTokenSchema.index({ used: 1 });
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Método estático para gerar token
// Função para gerar código amigável
function generateFriendlyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

passwordResetTokenSchema.statics.generateToken = async function(userId: string) {
  // Gerar código único (tentar até encontrar um não usado)
  let token = generateFriendlyCode();
  let existing = await this.findOne({ token, used: false });
  
  // Se o código já existe, gerar outro (máximo 10 tentativas)
  let attempts = 0;
  while (existing && attempts < 10) {
    token = generateFriendlyCode();
    existing = await this.findOne({ token, used: false });
    attempts++;
  }
  
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
  
  return this.create({
    userId,
    token,
    expiresAt,
    used: false
  });
};

// Método estático para validar token
passwordResetTokenSchema.statics.validateToken = async function(token: string) {
  const resetToken = await this.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() }
  }).populate('userId');
  
  return resetToken;
};

// Método para marcar token como usado
passwordResetTokenSchema.methods.markAsUsed = async function() {
  this.used = true;
  return this.save();
};

const PasswordResetToken = mongoose.model<IPasswordResetToken, IPasswordResetTokenModel>('PasswordResetToken', passwordResetTokenSchema);

export default PasswordResetToken;
