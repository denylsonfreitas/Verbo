import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import User from '../models/User';
import { AuditLogger } from '../models/AuditLog';
import connectDB from '../config/database';

dotenv.config();

const createInitialAdmin = async () => {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI ? 'Configurado' : 'NÃO CONFIGURADO');
    await connectDB();
    console.log('✅ Conectado ao banco de dados!');

    // Verificar se já existe um admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Já existe um administrador no sistema');
      console.log(`📧 Username: ${existingAdmin.username}`);
      console.log(`📧 Email: ${existingAdmin.email}`);
      return;
    }

    // Criar admin inicial
    const adminData = {
      username: 'admin',
      email: 'admin@verbo.com',
      password: 'admin123456' // Deve ser alterado após o primeiro login
    };

    console.log('👤 Criando administrador inicial...');
    const admin = await User.createAdmin(adminData.username, adminData.email, adminData.password);

    console.log('✅ Administrador criado com sucesso!');
    console.log(`📧 Username: ${admin.username}`);
    console.log(`📧 Email: ${admin.email}`);
    console.log('🔐 Senha: admin123456');
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');

    // Criar log de criação do admin
    const mockReq = {
      ip: '127.0.0.1',
      get: () => 'Seed Script',
      userId: admin._id,
      user: admin,
      originalUrl: '/seed/admin'
    };
    await AuditLogger.logSuccess('admin_creation', '/seed/admin', mockReq, {
      adminId: admin._id,
      adminUsername: admin.username
    });

  } catch (error) {
    console.error('❌ Erro ao criar administrador:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexão com banco de dados fechada');
  }
};

const createTestPlayer = async () => {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    await connectDB();

    // Verificar se já existe um jogador de teste
    const existingPlayer = await User.findOne({ username: 'teste' });
    
    if (existingPlayer) {
      console.log('✅ Já existe um jogador de teste no sistema');
      console.log(`👤 Username: ${existingPlayer.username}`);
      return;
    }

    // Criar jogador de teste
    const playerData = {
      username: 'teste',
      email: 'teste@verbo.com',
      password: 'teste123'
    };

    console.log('👤 Criando jogador de teste...');
    const player = await User.createPlayer(playerData.username, playerData.password, playerData.email);

    console.log('✅ Jogador de teste criado com sucesso!');
    console.log(`👤 Username: ${player.username}`);
    console.log(`📧 Email: ${player.email}`);
    console.log('🔐 Senha: teste123');

  } catch (error) {
    console.error('❌ Erro ao criar jogador de teste:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexão com banco de dados fechada');
  }
};

// Função principal
const main = async () => {
  const command = process.argv[2];

  switch (command) {
    case 'admin':
      await createInitialAdmin();
      break;
    case 'player':
      await createTestPlayer();
      break;
    case 'both':
      await createInitialAdmin();
      await createTestPlayer();
      break;
    default:
      console.log('📝 Uso:');
      console.log('  npm run seed:users admin   - Criar administrador inicial');
      console.log('  npm run seed:users player  - Criar jogador de teste');
      console.log('  npm run seed:users both    - Criar ambos');
      break;
  }
};

main().catch(console.error);
