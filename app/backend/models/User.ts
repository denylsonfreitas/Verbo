import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface para as estatísticas do jogo
export interface IGameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
    6: number;
  };
  lastPlayedDate: string | null;
  lastWonDate: string | null;
}

// Interface para entrada do histórico de palavras
export interface IWordHistoryEntry {
  word: string;
  verbId: string;
  date: string;
  won: boolean;
  attempts: number;
  guesses: Array<{
    letters: Array<{
      letter: string;
      status: 'correct' | 'wrong-position' | 'incorrect';
    }>;
  }>;
  hardMode: boolean;
}

// Interface do documento User
export interface IUser extends Document {
  username: string;
  email?: string;
  password: string;
  role: 'player' | 'admin';
  stats: IGameStats;
  gameHistory: IWordHistoryEntry[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos de instância
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Interface do modelo com métodos estáticos
interface IUserModel extends Model<IUser> {
  findByCredentials(login: string, password: string): Promise<IUser | null>;
  createPlayer(username: string, password: string, email?: string): Promise<IUser>;
  createAdmin(username: string, email: string, password: string): Promise<IUser>;
}

// Schema das estatísticas do jogo
const gameStatsSchema = new Schema<IGameStats>({
  gamesPlayed: { type: Number, default: 0 },
  gamesWon: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  maxStreak: { type: Number, default: 0 },
  guessDistribution: {
    1: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    5: { type: Number, default: 0 },
    6: { type: Number, default: 0 },
  },
  lastPlayedDate: { type: String, default: null },
  lastWonDate: { type: String, default: null },
}, { _id: false });

// Schema do histórico de palavras
const wordHistoryEntrySchema = new Schema<IWordHistoryEntry>({
  word: { type: String, required: true },
  verbId: { type: String, required: true },
  date: { type: String, required: true },
  won: { type: Boolean, required: true },
  attempts: { type: Number, required: true },
  guesses: [{
    letters: [{
      letter: { type: String, required: true },
      status: { 
        type: String, 
        enum: ['correct', 'wrong-position', 'incorrect'],
        required: true 
      }
    }]
  }],
  hardMode: { type: Boolean, default: false }
}, { _id: false });

// Schema principal do usuário
const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, 'Username é obrigatório'],
    trim: true,
    lowercase: true,
    unique: true,
    minlength: [3, 'Username deve ter pelo menos 3 caracteres'],
    maxlength: [20, 'Username deve ter no máximo 20 caracteres'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e underscore'],
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true, // Permite múltiplos documentos com email null
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email deve ter um formato válido'],
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password é obrigatório'],
    minlength: [6, 'Password deve ter pelo menos 6 caracteres']
  },
  role: {
    type: String,
    enum: ['player', 'admin'],
    default: 'player',
    required: true,
    index: true
  },
  stats: {
    type: gameStatsSchema,
    default: () => ({
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      lastPlayedDate: null,
      lastWonDate: null
    })
  },
  gameHistory: [wordHistoryEntrySchema],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

// Middleware para hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  const user = this;
  
  // Só faz hash se a senha foi modificada
  if (!user.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error as any);
  }
});

// Método para comparar senhas
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Método para remover dados sensíveis ao serializar
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Método estático para encontrar usuário por credenciais
userSchema.statics.findByCredentials = async function(login: string, password: string): Promise<IUser | null> {
  // Busca por username ou email
  const user = await this.findOne({
    $or: [
      { username: login.toLowerCase() },
      { email: login.toLowerCase() }
    ],
    isActive: true
  });

  if (!user) {
    return null;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return null;
  }

  return user;
};

// Método estático para criar jogador
userSchema.statics.createPlayer = async function(username: string, password: string, email?: string): Promise<IUser> {
  const userData: any = {
    username: username.toLowerCase(),
    password,
    role: 'player'
  };

  if (email && email.trim()) {
    userData.email = email.toLowerCase();
  }

  const user = new this(userData);
  await user.save();
  return user;
};

// Método estático para criar admin
userSchema.statics.createAdmin = async function(username: string, email: string, password: string): Promise<IUser> {
  const user = new this({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    role: 'admin'
  });

  await user.save();
  return user;
};

// Índices compostos para melhor performance
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model<IUser, IUserModel>('User', userSchema);

export default User;
