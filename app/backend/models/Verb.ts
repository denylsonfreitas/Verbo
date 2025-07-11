import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IVerb extends Document {
  word: string;
  date: Date;
  active: boolean;
  category: 'regular' | 'irregular' | 'auxiliary';
  conjugation: 'first' | 'second' | 'third';
  meaning: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface IVerbModel extends Model<IVerb> {
  getTodaysVerb(date?: Date): Promise<IVerb | null>;
  getVerbsByPeriod(startDate: Date, endDate: Date): Promise<IVerb[]>;
}

const verbSchema = new Schema<IVerb>(
  {
    word: {
      type: String,
      required: [true, 'Word is required'],
      trim: true,
      lowercase: true,
      minlength: [2, 'Word must have at least 2 characters'],
      maxlength: [15, 'Word must have at most 15 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      unique: true,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      enum: ['regular', 'irregular', 'auxiliary'],
      default: 'regular',
    },
    conjugation: {
      type: String,
      enum: ['first', 'second', 'third'],
      required: [true, 'Conjugation is required'],
    },
    meaning: {
      type: String,
      required: [true, 'Meaning is required'],
      maxlength: [200, 'Meaning must have at most 200 characters'],
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    collection: 'verbs',
  }
);

verbSchema.index({ date: 1, active: 1 });
verbSchema.index({ word: 1 });

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

verbSchema.statics.getTodaysVerb = function (date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return this.findOne({
    date: { $gte: startOfDay, $lte: endOfDay },
    active: true,
  });
};

verbSchema.statics.getVerbsByPeriod = function (
  startDate: Date,
  endDate: Date
) {
  return this.find({
    date: { $gte: startDate, $lte: endDate },
    active: true,
  }).sort({ date: 1 });
};

const Verb = mongoose.model<IVerb, IVerbModel>('Verb', verbSchema);
export default Verb;
