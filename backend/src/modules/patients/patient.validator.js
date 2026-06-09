const { z } = require('zod');

const objectIdSchema = z.string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ID inválido');

const patientIdParamSchema = z.object({
  patientId: objectIdSchema
});

const registerPatientSchema = z.object({
  name: z.string()
    .trim()
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .max(100, 'O nome não pode passar de 100 caracteres'),
  cpf: z.string()
    .transform(val => (typeof val === 'string' ? val.replace(/[^0-9]/g, '') : ''))
    .refine(val => val.length === 11, { message: 'CPF inválido.' }),
  phone: z.string()
    .transform(val => (typeof val === 'string' ? val.replace(/[^0-9]/g, '') : ''))
    .refine(val => val.length >= 10 && val.length <= 11, { message: 'Telefone inválido.' }),
  idade: z.preprocess((val) => {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      return trimmed === '' ? undefined : Number(trimmed);
    }
    return val;
  }, z.number().int().min(0, 'Idade deve ser um número válido').max(150, 'Idade muito alta').optional()),
  observations: z.string()
    .trim()
    .max(500, 'Observações muito longas')
    .optional(),
  convenioId: z.union([
    objectIdSchema,
    z.string().length(0),
    z.null()
  ]).optional().transform(val => (val === '' ? null : val)),
  isPresent: z.boolean().optional().default(true)
});

const diagnosisSchema = z.object({
  Cid: z.string().trim().optional(),
  description: z.string().trim().max(1000, 'Descrição muito longa').optional()
}).optional();

const quickHistoryItemSchema = z.object({
  comorbidities: z.string().trim().max(500, 'Campo comorbidades muito longo').optional(),
  diesease: z.string().trim().max(500, 'Campo doença muito longo').optional(),
  observation: z.string().trim().max(10000, 'Observação muito longa').optional()
});

const medicalRecordSchema = z.object({
  patientId: objectIdSchema,
  quickHistory: z.array(quickHistoryItemSchema).optional(),
  diagnosis: diagnosisSchema.optional()
});

const evolutionSchema = z.object({
  patientId: objectIdSchema,
  diagnosis: diagnosisSchema.optional(),
  evolutionText: z.string().trim().max(15000, 'Evolução muito longa').optional()
});

const prescriptionSchema = z.object({
  patientId: objectIdSchema,
  diagnosis: diagnosisSchema.optional(),
  medications: z.array(z.object({
    name: z.string().trim().min(1, 'Nome do medicamento é obrigatório').max(200, 'Nome do medicamento muito longo'),
    dosage: z.string().trim().min(1, 'Dosagem é obrigatória').max(200, 'Dosagem muito longa'),
    frequency: z.string().trim().min(1, 'Frequência é obrigatória').max(200, 'Frequência muito longa'),
    duration: z.string().trim().min(1, 'Duração é obrigatória').max(200, 'Duração muito longa')
  })).min(1, 'Ao menos um medicamento é obrigatório'),
  observations: z.string().trim().max(5000, 'Observações muito longas').optional()
});

module.exports = {
  registerPatientSchema,
  medicalRecordSchema,
  evolutionSchema,
  prescriptionSchema,
  patientIdParamSchema
};
