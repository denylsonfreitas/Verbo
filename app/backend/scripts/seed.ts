import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import Verb from '../models/Verb';
import CommonWord from '../models/CommonWord';

dotenv.config();

interface SimplifiedVerb {
  word: string;
  active: boolean;
  used: boolean;
}

// words comuns de 5 letras para validação (serão inseridas como CommonWord)
const commonWords = [
  'amora',
  'casas',
  'banho',
  'mesas',
  'luzes',
  'cores',
  'noite',
  'fruta',
  'praia',
  'dente',
  'olhos',
  'faces',
  'pizza',
  'salas',
  'copos',
  'sucos',
  'meses',
  'fotos',
  'chave',
  'pecas',
  'regra',
  'prova',
  'sabao',
  'lagos',
  'ponte',
  'prato',
  'velas',
  'cabos',
  'arroz',
  'tinta',
  'sonho',
  'doces',
  'gotas',
  'carta',
  'trens',
  'sopas',
  'tacas',
  'dedos',
  'moeda',
  'navio',
  'terra',
  'coroa',
  'globo',
  'traje',
  'turma',
  'gente',
  'festa',
  'vidas',
  'grana',
  'cenas',
  'chuva',
  'folha',
  'vidro',
  'caixa',
  'valsa',
  'andar',
  'volta',
  'aceno',
  'local',
  'amigo',
  'poder',
  'saber',
  'olhar',
  'ouvir',
  'sabor',
  'arena',
  'bolsa',
  'canto',
  'gemas',
  'morro',
  'banda',
  'tempo',
  'choro',
  'risos',
  'barco',
  'mapas',
  'cerca',
  'grito',
  'queda',
  'picos',
  'risco',
  'sinal',
  'fibra',
  'retro',
  'grama',
  'tocha',
  'monte',
  'carro',
  'prado',
  'peixe',
  'vento',
  'senha',
  'cacto',
  'terno',
  'tampa',
  'varal',
  'bolso',
  'poema',
  'mundo',
  'perda',
  'venda',
  'saldo',
  'porta',
  'nuvem',
  'bebes',
];

// Função para criar words comuns (agora inseridas na collection separada)
const createCommonWords = async (): Promise<void> => {
  console.log('🔤 Inserindo palavras comuns para validação...');
  
  try {
    // Limpar palavras comuns existentes
    await CommonWord.deleteMany({});
    
    // Inserir palavras comuns em lotes para melhor performance
    await CommonWord.addWords(commonWords, 'other');
    
    console.log(`✅ ${commonWords.length} palavras comuns inseridas com sucesso!`);
  } catch (error) {
    console.error('❌ Erro ao inserir palavras comuns:', error);
    throw error;
  }
};

// Verbos de 5 letras para o jogo (apenas word, date e active - outros campos serão inferidos automaticamente)
const initialVerbs: SimplifiedVerb[] = [
  {
    word: 'abrir',
    active: true,
    used: false,
  },
  {
    word: 'achar',
    active: true,
    used: false,
  },
  {
    word: 'andar',
    active: true,
    used: false,
  },
  {
    word: 'arder',
    active: true,
    used: false,
  },
  {
    word: 'atuar',
    active: true,
    used: false,
  },
  {
    word: 'bater',
    active: true,
    used: false,
  },
  {
    word: 'beber',
    active: true,
    used: false,
  },
  {
    word: 'bufar',
    active: true,
    used: false,
  },
  {
    word: 'caber',
    active: true,
    used: false,
  },
  {
    word: 'calar',
    active: true,
    used: false,
  },
  {
    word: 'casar',
    active: true,
    used: false,
  },
  {
    word: 'cavar',
    active: true,
    used: false,
  },
  {
    word: 'ceder',
    active: true,
    used: false,
  },
  {
    word: 'citar',
    active: true,
    used: false,
  },
  {
    word: 'colar',
    active: true,
    used: false,
  },
  {
    word: 'comer',
    active: true,
    used: false,
  },
  {
    word: 'criar',
    active: true,
    used: false,
  },
  {
    word: 'curar',
    active: true,
    used: false,
  },
  {
    word: 'dizer',
    active: true,
    used: false,
  },
  {
    word: 'errar',
    active: true,
    used: false,
  },
  {
    word: 'falar',
    active: true,
    used: false,
  },
  {
    word: 'fazer',
    active: true,
    used: false,
  },
  {
    word: 'ferir',
    active: true,
    used: false,
  },
  {
    word: 'ficar',
    active: true,
    used: false,
  },
  {
    word: 'fitar',
    active: true,
    used: false,
  },
  {
    word: 'focar',
    active: true,
    used: false,
  },
  {
    word: 'frear',
    active: true,
    used: false,
  },
  {
    word: 'fugir',
    active: true,
    used: false,
  },
  {
    word: 'girar',
    active: true,
    used: false,
  },
  {
    word: 'guiar',
    active: true,
    used: false,
  },
  {
    word: 'jogar',
    active: true,
    used: false,
  },
  {
    word: 'lavar',
    active: true,
    used: false,
  },
  {
    word: 'ligar',
    active: true,
    used: false,
  },
  {
    word: 'lutar',
    active: true,
    used: false,
  },
  {
    word: 'medir',
    active: true,
    used: false,
  },
  {
    word: 'mexer',
    active: true,
    used: false,
  },
  {
    word: 'mirar',
    active: true,
    used: false,
  },
  {
    word: 'morar',
    active: true,
    used: false,
  },
  {
    word: 'mover',
    active: true,
    used: false,
  },
  {
    word: 'mudar',
    active: true,
    used: false,
  },
  {
    word: 'nadar',
    active: true,
    used: false,
  },
  {
    word: 'negar',
    active: true,
    used: false,
  },
  {
    word: 'notar',
    active: true,
    used: false,
  },
  {
    word: 'odiar',
    active: true,
    used: false,
  },
  {
    word: 'olhar',
    active: true,
    used: false,
  },
  {
    word: 'ousar',
    active: true,
    used: false,
  },
  {
    word: 'ouvir',
    active: true,
    used: false,
  },
  {
    word: 'pagar',
    active: true,
    used: false,
  },
  {
    word: 'parar',
    active: true,
    used: false,
  },
  {
    word: 'pedir',
     active: true,
    used: false,
  },
  {
    word: 'pesar',
    active: true,
    used: false,
  },
  {
    word: 'pisar',
    active: true,
    used: false,
  },
  {
    word: 'poder',
    active: true,
    used: false,
  },
  {
    word: 'pular',
    active: true,
    used: false,
  },
  {
    word: 'punir',
    active: true,
    used: false,
  },
  {
    word: 'puxar',
    active: true,
    used: false,
  },
  {
    word: 'regar',
    active: true,
    used: false,
  },
  {
    word: 'reger',
    active: true,
    used: false,
  },
  {
    word: 'remar',
    active: true,
    used: false,
  },
  {
    word: 'rezar',
    active: true,
    used: false,
  },
  {
    word: 'rodar',
    active: true,
    used: false,
  },
  {
    word: 'rolar',
    active: true,
    used: false,
  },
  {
    word: 'saber',
    active: true,
    used: false,
  },
  {
    word: 'sarar',
    active: true,
    used: false,
  },
  {
    word: 'secar',
    active: true,
    used: false,
  },
  {
    word: 'subir',
    active: true,
    used: false,
  },
  {
    word: 'sujar',
    active: true,
    used: false,
  },
  {
    word: 'sumir',
    active: true,
    used: false,
  },
  {
    word: 'tapar',
    active: true,
    used: false,
  },
  {
    word: 'tirar',
    active: true,
    used: false,
  },
  {
    word: 'tocar',
    active: true,
    used: false,
  },
  {
    word: 'tomar',
    active: true,
    used: false,
  },
  {
    word: 'trair',
    active: true,
    used: false,
  },
  {
    word: 'valer',
    active: true,
    used: false,
  },
  {
    word: 'viver',
    active: true,
    used: false,
  },
  {
    word: 'votar',
    active: true,
    used: false,
  },
  {
    word: 'zelar',
    active: true,
    used: false,
  },
];

const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/verbo-game'
    );
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const populateVerbs = async (): Promise<void> => {
  try {
    // Clear existing verbs
    await Verb.deleteMany({});
    console.log('🗑️ Existing verbs removed');

    // Insert game verbs (simplified model with only word, date, and active status)
    await Verb.insertMany(initialVerbs);
    console.log(`✅ ${initialVerbs.length} game verbs inserted`);

    // Insert common words separately
    await createCommonWords();

    // List only game verbs (active)
    const gameVerbs = await Verb.find({ active: true }).sort({ date: 1 });
    console.log('\n📋 Game verbs registered:');
    gameVerbs.forEach(verb => {
    });
  } catch (error) {
    console.error('❌ Error populating verbs:', error);
    process.exit(1);
  }
};

const execute = async (): Promise<void> => {
  try {
    await connectDatabase();
    await populateVerbs();
    console.log('\n🎉 Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seed execution:', error);
    process.exit(1);
  }
};

execute();
