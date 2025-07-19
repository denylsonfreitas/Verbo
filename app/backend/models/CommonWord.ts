import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICommonWord extends Document {
  word: string;
  type: 'noun' | 'adjective' | 'verb' | 'other';
  active: boolean;
}

interface ICommonWordModel extends Model<ICommonWord> {
  isValidWord(word: string): Promise<boolean>;
  addWords(words: string[], type?: string): Promise<ICommonWord[]>;
}

const commonWordSchema = new Schema<ICommonWord>(
  {
    word: {
      type: String,
      required: [true, 'Word is required'],
      trim: true,
      lowercase: true,
      unique: true,
      minlength: [2, 'Word must have at least 2 characters'],
      maxlength: [15, 'Word must have at most 15 characters'],
    },
    type: {
      type: String,
      enum: ['noun', 'adjective', 'verb', 'other'],
      default: 'other',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'common_words',
  }
);

// Índices para performance (word já tem índice único automático)
commonWordSchema.index({ active: 1 });
commonWordSchema.index({ type: 1 });
commonWordSchema.index({ type: 1, active: 1 });

// Método estático para verificar se uma palavra é válida
commonWordSchema.statics.isValidWord = function (word: string) {
  return this.findOne({
    word: word.toLowerCase().trim(),
    active: true,
  });
};

// Método estático para adicionar múltiplas palavras
commonWordSchema.statics.addWords = async function (
  words: string[],
  type: string = 'other'
) {
  const operations = words.map(word => ({
    updateOne: {
      filter: { word: word.toLowerCase().trim() },
      update: {
        $setOnInsert: {
          word: word.toLowerCase().trim(),
          type,
          active: true,
          createdAt: new Date(),
        }
      },
      upsert: true
    }
  }));

  const result = await this.bulkWrite(operations, { ordered: false });
  
  // Retornar as palavras que foram realmente inseridas
  const insertedWords = await this.find({
    word: { $in: words.map(w => w.toLowerCase().trim()) }
  });
  
  return insertedWords;
};

const CommonWord = mongoose.model<ICommonWord, ICommonWordModel>(
  'CommonWord',
  commonWordSchema
);

export default CommonWord;
