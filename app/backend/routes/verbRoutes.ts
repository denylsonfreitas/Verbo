import express from 'express';
import Verb from '../models/Verb';
import CommonWord from '../models/CommonWord';
import { validateAttempt, normalizeWord, sanitizeString } from '../utils/validation';

const router = express.Router();

// Variável para controlar quando foi feita a última marcação de verbos
let lastVerbMarkDate = '';

// GET /api/verb/day - Get today's verb (same verb all day)
router.get('/day', async (_: any, res: any) => {
  try {
    // Busca o verbo do dia (determinístico baseado na data)
    const verb = await Verb.getTodaysVerb();

    if (!verb) {
      // Se não há verbos disponíveis, pode resetar todos ou retornar erro
      const stats = await Verb.getUsageStats();
      
      return res.status(404).json({
        error: 'Nenhum verbo disponível',
        message: 'Todos os verbos já foram usados. Entre em contato com o administrador para resetar.',
        stats: stats
      });
    }

    // APENAS marcar o verbo de ontem (uma vez por dia, não a cada request)
    // Isso evita a marcação excessiva de verbos
    // Usar horário do Brasil (UTC-3)
    const now = new Date();
    const brazilNow = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    const today = brazilNow.toISOString().split('T')[0];
    
    if (lastVerbMarkDate !== today) {
      await Verb.markPreviousVerbsAsUsed();
      lastVerbMarkDate = today;
    }

    console.log(`Verbo do dia: "${verb.word}" (${today})`);

    res.json({
      word: verb.word,
      length: verb.word.length,
      id: verb._id, // Incluindo ID para referência
    });
  } catch (error) {
    console.error('Erro ao buscar verbo do dia:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar o verbo do dia',
    });
  }
});

// POST /api/verb/attempt - Make an attempt  
router.post('/attempt', async (req: any, res: any) => {
  try {
    const { word, verbId } = req.body;

    // Validação da tentativa
    const validation = validateAttempt(word);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Tentativa inválida',
        message: validation.message,
        code: validation.code,
      });
    }

    // Buscar o verbo específico pelo ID
    const verb = await Verb.findById(verbId);
    if (!verb || !verb.active) {
      return res.status(404).json({
        error: 'Verbo não encontrado',
        message: 'O verbo especificado não existe ou não está ativo',
      });
    }

    // Gerar feedback da tentativa
    const feedback = generateFeedback(word, verb.word);
    const victory = word.toLowerCase() === verb.word.toLowerCase();

    // Retornar resultado (verbo será marcado como usado automaticamente no dia seguinte)
    res.json({
      feedback,
      victory,
      word: victory ? verb.word : null,
      correctWord: verb.word,
    });
  } catch (error) {
    console.error('Erro ao processar tentativa:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível processar sua tentativa',
    });
  }
});



// GET /api/verb/validate?word=xxxxx - Check if the word exists
router.get('/validate', async (req: any, res: any) => {
  const { word } = req.query;
  
  // Validação básica da entrada
  const validation = validateAttempt(word);
  if (!validation.valid) {
    return res.status(400).json({ 
      valid: false, 
      message: validation.message,
      code: validation.code 
    });
  }

  try {
    // Sanitizar e normalizar a palavra
    const sanitizedWord = sanitizeString(word);
    const normalizedWord = normalizeWord(sanitizedWord);
    
    // Buscar primeiro nos verbos do jogo
    const verbExists = await Verb.findOne({
      $or: [
        { word: sanitizedWord.toLowerCase() },
        { word: normalizedWord }
      ]
    });

    // Se encontrou nos verbos, é válida
    if (verbExists) {
      return res.json({ valid: true, type: 'verb' });
    }

    // Se não encontrou nos verbos, buscar nas palavras comuns
    const commonWordExists = await CommonWord.isValidWord(sanitizedWord);
    
    if (commonWordExists) {
      return res.json({ valid: true, type: 'common' });
    }

    // Palavra não encontrada em nenhum lugar
    return res.json({ 
      valid: false, 
      message: 'Palavra não encontrada',
      code: 'WORD_NOT_FOUND'
    });
  } catch (error) {
    console.error('Erro ao validar palavra:', error);
    return res.status(500).json({ 
      valid: false, 
      message: 'Erro interno do servidor',
      code: 'SERVER_ERROR'
    });
  }
});

// Feedback generation helper
function generateFeedback(attempt: string, correctWord: string) {
  const attemptLower = attempt.toLowerCase();
  const correctWordLower = correctWord.toLowerCase();
  const feedback: Array<{ letter: string; status: string }> = [];

  const letterCount: { [key: string]: number } = {};
  for (let letter of correctWordLower) {
    letterCount[letter] = (letterCount[letter] || 0) + 1;
  }

  for (let i = 0; i < attemptLower.length; i++) {
    const letter = attemptLower[i];

    if (letter === correctWordLower[i]) {
      feedback.push({ letter: attempt[i], status: 'correct' });
      letterCount[letter]--;
    } else {
      feedback.push({ letter: attempt[i], status: 'incorrect' });
    }
  }

  for (let i = 0; i < attemptLower.length; i++) {
    const letter = attemptLower[i];

    if (feedback[i].status === 'incorrect' && letterCount[letter] > 0) {
      feedback[i].status = 'wrong-position';
      letterCount[letter]--;
    }
  }

  return feedback;
}

// GET /api/verb/stats - Get usage statistics
const { authenticateJWT } = require('../middleware/auth');
router.get('/stats', authenticateJWT, async (req: any, res: any) => {
  try {
    // Retorna as estatísticas do usuário autenticado
    const user = req.user;
    console.log('[STATS] Usuário autenticado:', user ? user.username : null, 'ID:', user ? user._id : null);
    if (!user) {
      console.log('[STATS] Usuário não encontrado');
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    if (!user.stats) {
      console.log('[STATS] Usuário sem estatísticas, inicializando stats padrão');
      user.stats = {
        statId: '',
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
        guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
        lastPlayedDate: null,
        lastWonDate: null
      };
      user.markModified('stats');
      await user.save();
    }
    console.log('[STATS] Estatísticas retornadas:', user.stats);
    res.json(user.stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas do usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar as estatísticas do usuário',
    });
  }
});

// GET /api/verb/debug - Debug daily system (only for development)
router.get('/debug', async (_: any, res: any) => {
  try {
    const debugInfo = await Verb.debugDailySystem(10); // Últimos 10 dias
    const stats = await Verb.getUsageStats();
    
    // Mostrar data/hora atual do Brasil
    const now = new Date();
    const brazilNow = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    
    res.json({
      dailySystem: debugInfo,
      stats: stats,
      currentDate: brazilNow.toISOString().split('T')[0],
      currentDateTime: brazilNow.toISOString().replace('T', ' ').substring(0, 19) + ' (Brasil UTC-3)',
      utcDateTime: now.toISOString().replace('T', ' ').substring(0, 19) + ' (UTC)'
    });
  } catch (error) {
    console.error('Erro ao buscar informações de debug:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar as informações de debug',
    });
  }
});

export default router;
