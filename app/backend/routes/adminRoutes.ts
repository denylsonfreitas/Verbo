import express, { Request, Response, NextFunction } from 'express';
import Verb from '../models/Verb';
import * as Joi from 'joi';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Schema de validação simplificado para verbos (apenas word obrigatório)
const verbSchema = Joi.object({
  word: Joi.string()
    .length(5)
    .pattern(/^[a-zA-ZÀ-ÿ]+$/)
    .required()
    .messages({
      'string.pattern.base': 'A palavra deve conter apenas letras',
      'string.length': 'A palavra deve ter exatamente 5 letras',
    }),
  active: Joi.boolean().optional().default(true),
  used: Joi.boolean().optional().default(false),
});

// Schema de validação para updates parciais
const verbUpdateSchema = Joi.object({
  word: Joi.string()
    .length(5)
    .pattern(/^[a-zA-ZÀ-ÿ]+$/)
    .messages({
      'string.pattern.base': 'A palavra deve conter apenas letras',
      'string.length': 'A palavra deve ter exatamente 5 letras',
    }),
  active: Joi.boolean(),
  used: Joi.boolean(),
}).min(1); // Pelo menos um campo deve ser fornecido

// POST /api/admin/verbs - Create new verb
router.post(
  '/verbs',
  authenticateJWT,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { error, value } = verbSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          error: 'Dados inválidos',
          message: error.details[0].message,
        });
        return;
      }

      // Verificar se já existe um verbo com a mesma palavra
      const existingVerb = await Verb.findOne({ word: value.word });
      if (existingVerb) {
        res.status(409).json({
          error: 'Verbo já cadastrado',
          message: 'Já existe um verbo com esta palavra',
        });
        return;
      }

      // Criar novo verbo
      const newVerb = new Verb({
        word: value.word.toLowerCase(),
        active: value.active,
        used: value.used,
      });

      await newVerb.save();

      res.status(201).json({
        message: 'Verbo cadastrado com sucesso',
        verb: {
          id: newVerb._id,
          word: newVerb.word,
          active: newVerb.active,
          used: newVerb.used,
        },
      });
    } catch (error) {
      console.error('Erro ao cadastrar verbo:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao processar solicitação',
      });
    }
  }
);

// GET /api/admin/verbs - List verbs
router.get(
  '/verbs',
  authenticateJWT,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 20, active, search } = req.query;

      const filter: any = {};
      if (active !== undefined) {
        filter.active = active === 'true';
      }

      // Adicionar filtro de busca se fornecido
      if (search && typeof search === 'string' && search.trim()) {
        filter.word = { $regex: search.trim(), $options: 'i' };
      }

      const verbs = await Verb.find(filter)
        .sort({ createdAt: -1 }) // Ordenar por data de criação
        .limit(parseInt(limit as string))
        .skip((parseInt(page as string) - 1) * parseInt(limit as string))
        .select('-__v');

      const total = await Verb.countDocuments(filter);

      res.json({
        verbs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      console.error('Erro ao listar verbos:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao processar solicitação',
      });
    }
  }
);

// PUT /api/admin/verbs/:id - Update verb
router.put(
  '/verbs/:id',
  authenticateJWT,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const { error, value } = verbUpdateSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          error: 'Dados inválidos',
          message: error.details[0].message,
        });
        return;
      }

      // Se está atualizando a palavra, verificar se já existe outra com o mesmo valor
      if (value.word) {
        const existingVerb = await Verb.findOne({
          word: value.word,
          _id: { $ne: id },
        });
        if (existingVerb) {
          res.status(409).json({
            error: 'Verbo já cadastrado',
            message: 'Já existe um verbo com esta palavra',
          });
          return;
        }
        value.word = value.word.toLowerCase();
      }

      // Atualizar verbo
      const updatedVerb = await Verb.findByIdAndUpdate(id, value, {
        new: true,
        runValidators: true,
      });

      if (!updatedVerb) {
        res.status(404).json({
          error: 'Verbo não encontrado',
          message: 'Verbo não encontrado no sistema',
        });
        return;
      }

      res.json({
        message: 'Verbo atualizado com sucesso',
        verb: {
          id: updatedVerb._id,
          word: updatedVerb.word,
          active: updatedVerb.active,
          used: updatedVerb.used,
        },
      });
    } catch (error) {
      console.error('Erro ao atualizar verbo:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao processar solicitação',
      });
    }
  }
);

// DELETE /api/admin/verbs/:id - Delete verb
router.delete(
  '/verbs/:id',
  authenticateJWT,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const deletedVerb = await Verb.findByIdAndDelete(id);

      if (!deletedVerb) {
        res.status(404).json({
          error: 'Verbo não encontrado',
          message: 'Verbo não encontrado no sistema',
        });
        return;
      }

      res.json({
        message: 'Verbo removido com sucesso',
      });
    } catch (error) {
      console.error('Erro ao remover verbo:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao processar solicitação',
      });
    }
  }
);

// PUT /api/admin/verbs/:id/activate - Activate verb
router.put(
  '/verbs/:id/activate',
  authenticateJWT,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const updatedVerb = await Verb.findByIdAndUpdate(
        id,
        { active: true },
        { new: true }
      );

      if (!updatedVerb) {
        res.status(404).json({
          error: 'Verbo não encontrado',
          message: 'Verbo não encontrado no sistema',
        });
        return;
      }

      res.json({
        message: 'Verbo ativado com sucesso',
        verb: {
          id: updatedVerb._id,
          word: updatedVerb.word,
          active: updatedVerb.active,
          used: updatedVerb.used,
        },
      });
    } catch (error) {
      console.error('Erro ao ativar verbo:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao processar solicitação',
      });
    }
  }
);

// GET /api/admin/stats - Admin statistics
router.get(
  '/stats',
  authenticateJWT,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const totalVerbs = await Verb.countDocuments();
      const activeVerbs = await Verb.countDocuments({ active: true });
      const usedVerbs = await Verb.countDocuments({ used: true });

      res.json({
        totalVerbs,
        activeVerbs,
        usedVerbs,
        inactiveVerbs: totalVerbs - activeVerbs,
        availableVerbs: activeVerbs - usedVerbs,
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao processar solicitação',
      });
    }
  }
);

export default router;
