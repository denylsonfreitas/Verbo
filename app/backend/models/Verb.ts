import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IVerb extends Document {
  word: string;
  active: boolean;
  used: boolean;
}

interface IVerbModel extends Model<IVerb> {
  getTodaysVerb(date?: Date): Promise<IVerb | null>;
  markAsUsed(verbId: string): Promise<IVerb | null>;
  markPreviousVerbsAsUsed(): Promise<void>;
  resetAllVerbs(): Promise<void>;
  getUsageStats(): Promise<{total: number, used: number, available: number}>;
  debugDailySystem(daysToCheck?: number): Promise<Array<{date: string, verb: string, used: boolean | null, id: any}>>;
}

const verbSchema = new Schema<IVerb>(
  {
    word: {
      type: String,
      required: [true, 'Word is required'],
      trim: true,
      lowercase: true,
      unique: true,
      minlength: [2, 'Word must have at least 2 characters'],
      maxlength: [5, 'Word must have at most 5 characters'],
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    used: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    collection: 'verbs',
  }
);

verbSchema.index({ active: 1, used: 1 });

verbSchema.pre<IVerb>('save', function (next) {
  const verbSuffixes = ['ar', 'er', 'ir', 'or'];
  const endsWithSuffix = verbSuffixes.some(suffix =>
    this.word.toLowerCase().endsWith(suffix)
  );
  if (!endsWithSuffix) {
    return next(new Error('Word must be a valid Portuguese verb'));
  }
  next();
});

verbSchema.statics.getTodaysVerb = async function (date = new Date()) {
  // Ajustar para o fuso horário do Brasil (UTC-3)
  const brazilDate = new Date(date.getTime() - (3 * 60 * 60 * 1000));
  
  // Criar uma seed baseada na data brasileira (YYYY-MM-DD)
  const dateStr = brazilDate.toISOString().split('T')[0]; // "2025-07-12"
  
  // Buscar todos os verbos ativos não usados
  const activeVerbs = await this.find({
    active: true,
    used: false,
  }).sort({ _id: 1 }); // Ordenar por ID para ser mais determinístico

  if (activeVerbs.length === 0) {
    // Se não há verbos disponíveis, retorna null
    return null;
  }

  // Usar um hash melhor baseado no CRC32 simplificado
  function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
  
  const hash = simpleHash(dateStr);
  const index = hash % activeVerbs.length;
  
  return activeVerbs[index];
};

verbSchema.statics.markAsUsed = function (verbId: string) {
  return this.findByIdAndUpdate(
    verbId,
    { used: true },
    { new: true }
  );
};

verbSchema.statics.markPreviousVerbsAsUsed = async function () {
  // SISTEMA MAIS SIMPLES: Apenas marcar o verbo de ontem se ainda não foi marcado
  // Evita a marcação agressiva de todos os verbos
  
  // Usar horário do Brasil (UTC-3)
  const today = new Date();
  const brazilToday = new Date(today.getTime() - (3 * 60 * 60 * 1000));
  
  const yesterday = new Date(brazilToday);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  try {
    // Pegar apenas o verbo de ontem
    const yesterdayVerb = await (this as IVerbModel).getTodaysVerb(yesterday);
    
    if (yesterdayVerb && !yesterdayVerb.used) {
      // Marcar apenas se ainda não foi marcado
      await this.findByIdAndUpdate(yesterdayVerb._id, { used: true });
      console.log(`Marcando verbo de ontem "${yesterdayVerb.word}" como usado (${yesterday.toISOString().split('T')[0]} - horário Brasil)`);
    }
  } catch (error) {
    console.error('Erro ao marcar verbo de ontem:', error);
  }
};

verbSchema.statics.resetAllVerbs = function () {
  return this.updateMany(
    { active: true },
    { used: false }
  );
};

verbSchema.statics.getUsageStats = async function () {
  const total = await this.countDocuments({ active: true });
  const used = await this.countDocuments({ active: true, used: true });
  const available = total - used;
  
  return { total, used, available };
};

// Método utilitário para debug do sistema de dias
verbSchema.statics.debugDailySystem = async function (daysToCheck = 7) {
  const results = [];
  
  // Usar horário do Brasil (UTC-3)
  const now = new Date();
  const brazilNow = new Date(now.getTime() - (3 * 60 * 60 * 1000));
  
  for (let i = 0; i < daysToCheck; i++) {
    const date = new Date(brazilNow);
    date.setDate(date.getDate() - i);
    
    const verb = await (this as IVerbModel).getTodaysVerb(date);
    results.push({
      date: date.toISOString().split('T')[0],
      verb: verb ? verb.word : 'null',
      used: verb ? verb.used : null,
      id: verb ? verb._id : null
    });
  }
  
  return results;
};

const Verb = mongoose.model<IVerb, IVerbModel>('Verb', verbSchema);
export default Verb;
