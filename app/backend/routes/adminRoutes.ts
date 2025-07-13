import express, { Request, Response, NextFunction } from 'express';
import Verb from '../models/Verb';
import * as Joi from 'joi';

const router = express.Router();

// Middleware de autenticação simples (em produção, usar JWT)
const autenticarAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { senha } = req.headers;

  if (senha !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({
      error: 'Não autorizado',
      message: 'Senha de administrador incorreta',
    });
    return;
  }

  next();
};

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
  autenticarAdmin,
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

      const verb = new Verb(value);
      await verb.save();

      res.status(201).json({
        message: 'Verbo cadastrado com sucesso',
        verb: {
          id: verb._id,
          word: verb.word,
          active: verb.active,
          used: verb.used,
        },
      });
      return;
    } catch (error: any) {
      console.error('Erro ao cadastrar verbo:', error);

      if (error.code === 11000) {
        res.status(409).json({
          error: 'Verbo duplicado',
          message: 'Este verbo já está cadastrado',
        });
        return;
      }

      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Não foi possível cadastrar o verbo',
      });
      return;
    }
  }
);

// GET /api/admin/verbs - List verbs
router.get(
  '/verbs',
  autenticarAdmin,
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
        message: 'Não foi possível listar os verbos',
      });
    }
  }
);

// PUT /api/admin/verbs/:id - Update verb
router.put(
  '/verbs/:id',
  autenticarAdmin,
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

      const verb = await Verb.findByIdAndUpdate(
        id,
        { ...value, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!verb) {
        res.status(404).json({
          error: 'Verbo não encontrado',
          message: 'O verbo especificado não foi encontrado',
        });
        return;
      }

      res.json({
        message: 'Verbo atualizado com sucesso',
        verb: {
          id: verb._id,
          word: verb.word,
          active: verb.active,
        },
      });
    } catch (error) {
      console.error('Erro ao atualizar verbo:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Não foi possível atualizar o verbo',
      });
    }
  }
);

// DELETE /api/admin/verbs/:id - Deactivate verb
router.delete(
  '/verbs/:id',
  autenticarAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const verb = await Verb.findByIdAndUpdate(
        id,
        { active: false, updatedAt: new Date() },
        { new: true }
      );

      if (!verb) {
        res.status(404).json({
          error: 'Verbo não encontrado',
          message: 'O verbo especificado não foi encontrado',
        });
        return;
      }

      res.json({
        message: 'Verbo desativado com sucesso',
        verb: {
          id: verb._id,
          word: verb.word,
          active: verb.active,
          used: verb.used,
        },
      });
    } catch (error) {
      console.error('Erro ao atualizar verbo:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Não foi possível atualizar o verbo',
      });
    }
  }
);

// POST /api/admin/verbs/reset - Reset all verbs (mark as unused)
router.post(
  '/verbs/reset',
  autenticarAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      await Verb.resetAllVerbs();
      const stats = await Verb.getUsageStats();

      res.json({
        message: 'Todos os verbos foram resetados com sucesso',
        stats: stats,
      });
    } catch (error) {
      console.error('Erro ao resetar verbos:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Não foi possível resetar os verbos',
      });
    }
  }
);

// GET /api/admin/verbs/stats - Get verb usage statistics
router.get(
  '/verbs/stats',
  autenticarAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await Verb.getUsageStats();
      res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Não foi possível buscar as estatísticas',
      });
    }
  }
);

export default router;
