import express from 'express';
import Verb from '../models/Verb';
import { validateAttempt, normalizeWord, sanitizeString } from '../utils/validation';

const router = express.Router();

// GET /api/verb/day - Get today's verb
router.get('/day', async (_: any, res: any) => {
  try {
    const verb = await Verb.getTodaysVerb();

    if (!verb) {
      return res.status(404).json({
        error: 'Nenhum verbo encontrado para hoje',
        message:
          'Tente novamente amanhã ou entre em contato com o administrador',
      });
    }

    res.json({
      date: verb.date,
      word: verb.word,
      length: verb.word.length,
      category: verb.category,
      conjugation: verb.conjugation,
      difficulty: verb.difficulty,
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
    const { word } = req.body;

    // Validação da tentativa
    const validation = validateAttempt(word);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Tentativa inválida',
        message: validation.message,
        code: validation.code,
      });
    }

    // Buscar verbo do dia
    const verb = await Verb.getTodaysVerb();
    if (!verb) {
      return res.status(404).json({
        error: 'Verbo do dia não encontrado',
        message: 'Tente novamente amanhã',
      });
    }

    // Gerar feedback da tentativa
    const feedback = generateFeedback(word, verb.word);
    const victory = word.toLowerCase() === verb.word.toLowerCase();

    // Retornar resultado (frontend gerencia o resto)
    res.json({
      feedback,
      victory,
      word: victory ? verb.word : null,
      correctWord: verb.word, // Para mostrar ao final do jogo
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
    
    // Buscar no banco tanto pela palavra original quanto normalizada
    const exists = await Verb.findOne({
      $or: [
        { word: sanitizedWord.toLowerCase() },
        { word: normalizedWord }
      ]
    });

    if (exists) {
      return res.json({ valid: true });
    } else {
      return res.json({ 
        valid: false, 
        message: 'Palavra não encontrada',
        code: 'WORD_NOT_FOUND'
      });
    }
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

export default router;
