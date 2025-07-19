import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

// Interface para o documento EmailVerificationToken
export interface IEmailVerificationToken extends Document {
  userId: mongoose.Types.ObjectId;
  newEmail: string;
  token: string;
  used: boolean;
  expiresAt: Date;
  markAsUsed(): Promise<IEmailVerificationToken>;
}

// Interface para o modelo EmailVerificationToken
export interface IEmailVerificationTokenModel extends mongoose.Model<IEmailVerificationToken> {
  generateToken(userId: string, newEmail: string): Promise<IEmailVerificationToken>;
  validateToken(token: string): Promise<IEmailVerificationToken | null>;
}

// Schema para EmailVerificationToken
const emailVerificationTokenSchema = new Schema<IEmailVerificationToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  newEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  used: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Índices para performance
emailVerificationTokenSchema.index({ userId: 1 });
emailVerificationTokenSchema.index({ used: 1 });
emailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Função para gerar código amigável
function generateFriendlyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Método estático para gerar token
emailVerificationTokenSchema.statics.generateToken = async function(userId: string, newEmail: string) {
  // Invalidar tokens anteriores para o mesmo usuário
  await this.updateMany(
    { userId: new mongoose.Types.ObjectId(userId), used: false },
    { used: true }
  );

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
  
  return this.create({
    userId: new mongoose.Types.ObjectId(userId),
    newEmail: newEmail,
    token: token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
  });
};

// Método estático para validar token
emailVerificationTokenSchema.statics.validateToken = async function(token: string) {
  const verificationToken = await this.findOne({
    token: token,
    used: false,
    expiresAt: { $gt: new Date() }
  });

  return verificationToken;
};

// Método de instância para marcar como usado
emailVerificationTokenSchema.methods.markAsUsed = async function() {
  this.used = true;
  return this.save();
};

const EmailVerificationToken = mongoose.model<IEmailVerificationToken, IEmailVerificationTokenModel>('EmailVerificationToken', emailVerificationTokenSchema);

export default EmailVerificationToken;
