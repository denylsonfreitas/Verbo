import express from 'express';
import CommonWord from '../models/CommonWord';
import Verb from '../models/Verb';
import { validateAttempt, sanitizeString } from '../utils/validation';

const router = express.Router();

// GET /api/words - List common words with pagination and filters
router.get('/', async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;
    const search = req.query.search;
    const active = req.query.active !== undefined ? req.query.active === 'true' : undefined;

    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter: any = {};
    if (type) filter.type = type;
    if (active !== undefined) filter.active = active;
    if (search) {
      filter.word = { $regex: search, $options: 'i' };
    }

    // Get words with pagination
    const words = await CommonWord.find(filter)
      .sort({ word: 1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await CommonWord.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      words,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Erro ao listar palavras:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível listar as palavras',
    });
  }
});

// POST /api/words - Add new common words
router.post('/', async (req: any, res: any) => {
  try {
    const { words, type = 'other' } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: 'É necessário fornecer um array de palavras',
      });
    }

    // Validate each word
    const validWords = [];
    const invalidWords = [];

    // Get all existing verbs to check for conflicts
    const existingVerbs = await Verb.find({}, 'word').lean();
    const verbWords = new Set(existingVerbs.map(v => v.word.toLowerCase()));

    for (const word of words) {
      const cleanWord = word.trim().toLowerCase();
      
      // Check if word is already a verb
      if (verbWords.has(cleanWord)) {
        invalidWords.push({ 
          word, 
          error: 'Esta palavra já existe como verbo do jogo' 
        });
        continue;
      }

      const validation = validateAttempt(word);
      if (validation.valid) {
        validWords.push(cleanWord);
      } else {
        invalidWords.push({ word, error: validation.message });
      }
    }

    if (validWords.length === 0) {
      return res.status(400).json({
        error: 'Nenhuma palavra válida',
        message: 'Todas as palavras fornecidas são inválidas',
        invalidWords,
      });
    }

    // Add valid words to database
    const addedWords = await CommonWord.addWords(validWords, type);

    res.status(201).json({
      message: `${addedWords.length} palavras adicionadas com sucesso`,
      addedWords,
      invalidWords: invalidWords.length > 0 ? invalidWords : undefined,
    });
  } catch (error: any) {
    console.error('Erro ao adicionar palavras:', error);
    
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível adicionar as palavras',
    });
  }
});

// PUT /api/words/:id - Update a common word
router.put('/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { word, type, active } = req.body;

    const updateData: any = {};
    
    if (word !== undefined) {
      const validation = validateAttempt(word);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Palavra inválida',
          message: validation.message,
        });
      }
      updateData.word = word.trim().toLowerCase();
    }

    if (type !== undefined) updateData.type = type;
    if (active !== undefined) updateData.active = active;

    const updatedWord = await CommonWord.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedWord) {
      return res.status(404).json({
        error: 'Palavra não encontrada',
        message: 'A palavra especificada não existe',
      });
    }

    res.json({
      message: 'Palavra atualizada com sucesso',
      word: updatedWord,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar palavra:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Palavra duplicada',
        message: 'Esta palavra já existe no banco de dados',
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível atualizar a palavra',
    });
  }
});

// DELETE /api/words/:id - Delete a common word
router.delete('/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const deletedWord = await CommonWord.findByIdAndDelete(id);

    if (!deletedWord) {
      return res.status(404).json({
        error: 'Palavra não encontrada',
        message: 'A palavra especificada não existe',
      });
    }

    res.json({
      message: 'Palavra removida com sucesso',
      word: deletedWord,
    });
  } catch (error) {
    console.error('Erro ao remover palavra:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível remover a palavra',
    });
  }
});

// POST /api/words/batch-import - Import words from text
router.post('/batch-import', async (req: any, res: any) => {
  try {
    const { text, type = 'other', separator = '\n' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: 'É necessário fornecer um texto com palavras',
      });
    }

    // Split text by separator and clean words
    const words = text
      .split(separator)
      .map(word => word.trim())
      .filter(word => word.length > 0);

    if (words.length === 0) {
      return res.status(400).json({
        error: 'Nenhuma palavra encontrada',
        message: 'Não foi possível extrair palavras do texto fornecido',
      });
    }

    // Process words like in POST /api/words
    const validWords = [];
    const invalidWords = [];

    // Get all existing verbs to check for conflicts
    const existingVerbs = await Verb.find({}, 'word').lean();
    const verbWords = new Set(existingVerbs.map(v => v.word.toLowerCase()));

    for (const word of words) {
      const cleanWord = word.trim().toLowerCase();
      
      // Check if word is already a verb
      if (verbWords.has(cleanWord)) {
        invalidWords.push({ 
          word, 
          error: 'Esta palavra já existe como verbo do jogo' 
        });
        continue;
      }

      const validation = validateAttempt(word);
      if (validation.valid) {
        validWords.push(cleanWord);
      } else {
        invalidWords.push({ word, error: validation.message });
      }
    }

    if (validWords.length === 0) {
      return res.status(400).json({
        error: 'Nenhuma palavra válida',
        message: 'Todas as palavras extraídas são inválidas',
        invalidWords,
      });
    }

    // Add valid words to database
    const addedWords = await CommonWord.addWords(validWords, type);

    res.status(201).json({
      message: `${addedWords.length} palavras importadas com sucesso`,
      total: words.length,
      valid: validWords.length,
      invalid: invalidWords.length,
      addedWords,
      invalidWords: invalidWords.length > 0 ? invalidWords : undefined,
    });
  } catch (error: any) {
    console.error('Erro ao importar palavras:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Palavras duplicadas',
        message: 'Algumas palavras já existem no banco de dados',
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível importar as palavras',
    });
  }
});

export default router;
