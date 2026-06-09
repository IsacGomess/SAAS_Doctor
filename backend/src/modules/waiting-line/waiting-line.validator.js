const { z } = require('zod');

const objectIdSchema = z.string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ID inválido');

const createWaitingLineSchema = z.object({
  patientId: objectIdSchema,
  assignedTo: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'ID do usuário inválido')
    .optional(),
  priority: z.enum(['normal', 'prioritario', 'emergencia']).optional().default('normal'),
  flowStage: z.enum(['recepcao', 'triagem', 'espera', 'consulta', 'retorno', 'internacao']).optional().default('espera'),
  clinicArea: z.string().trim().max(100, 'Área da clínica muito longa').optional(),
  source: z.enum(['avulso', 'consulta_agendada', 'emergencia']).optional().default('avulso'),
  estimatedWaitMinutes: z.number().positive('Tempo estimado deve ser positivo').optional(),
  observations: z.string().trim().max(15000, 'As observações não podem passar de 15000 caracteres').optional()
});

const getWaitingLineQuerySchema = z.object({
  status: z.enum(['aguardando', 'chamado', 'em_atendimento', 'finalizado', 'cancelado']).optional(),
  priority: z.enum(['normal', 'prioritario', 'emergencia']).optional(),
  flowStage: z.enum(['recepcao', 'triagem', 'espera', 'consulta', 'retorno', 'internacao']).optional(),
  clinicArea: z.string().trim().optional()
}).partial();

const idParamSchema = z.object({
  id: objectIdSchema
});

const updateStatusSchema = z.object({
  status: z.enum(['aguardando', 'chamado', 'em_atendimento', 'finalizado', 'cancelado']),
  observations: z.string().trim().max(15000, 'Observações muito longas').optional(),
  assignedTo: objectIdSchema.optional()
});

const cancelWaitingLineSchema = z.object({
  cancelledReason: z.string()
    .trim()
    .min(3, 'Motivo do cancelamento deve ter pelo menos 3 caracteres')
    .max(250, 'Motivo não pode passar de 250 caracteres')
});

module.exports = {
  createWaitingLineSchema,
  getWaitingLineQuerySchema,
  idParamSchema,
  updateStatusSchema,
  cancelWaitingLineSchema
};
