import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/verbo-game'
    );

    console.log(`MongoDB conectado: ${conn.connection.host}`);

    // Configurações adicionais do Mongoose
    mongoose.set('debug', process.env.NODE_ENV === 'development');
  } catch (error: any) {
    console.error('Erro ao conectar com MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;
