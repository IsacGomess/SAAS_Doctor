const { z } = require('zod');

const objectIdSchema = z.string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ID de convênio inválido');

const createConvenioSchema = z.object({
  nome: z.string()
    .trim()
    .min(1, 'Nome do convênio é obrigatório')
    .max(120, 'Nome do convênio é longo demais')
});

const convenioIdParamSchema = z.object({
  convenioId: objectIdSchema
});

module.exports = {
  createConvenioSchema,
  convenioIdParamSchema
};
