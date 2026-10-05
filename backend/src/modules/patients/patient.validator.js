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

const updatePatientSchema = z.object({
  name: z.string().trim().min(3, 'O nome deve ter pelo menos 3 caracteres').max(100, 'O nome não pode passar de 100 caracteres').optional(),
  cpf: z.string().transform(val => (typeof val === 'string' ? val.replace(/[^0-9]/g, '') : '')).refine(val => val.length === 11, { message: 'CPF inválido.' }).optional(),
  phone: z.string().transform(val => (typeof val === 'string' ? val.replace(/[^0-9]/g, '') : '')).refine(val => val.length >= 10 && val.length <= 11, { message: 'Telefone inválido.' }).optional(),
  idade: z.preprocess((val) => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      return trimmed === '' ? null : Number(trimmed);
    }
    return val;
  }, z.union([
    z.number().int().min(0, 'Idade deve ser um número válido').max(150, 'Idade muito alta'),
    z.null()
  ]).optional()),
  observations: z.string().trim().max(500, 'Observações muito longas').optional(),
  convenioId: z.union([
    objectIdSchema,
    z.string().length(0),
    z.null()
  ]).optional().transform(val => (val === '' ? null : val)),
  isPresent: z.boolean().optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Informe ao menos um campo para atualizar.',
  path: ['_root']
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
  evolutionText: z.string().trim().max(15000, 'Evolução muito longa').optional(),
  conduct: z.string().trim().max(10000, 'Conduta muito longa').optional(),
  patientRecommendations: z.string().trim().max(10000, 'Recomendação ao paciente muito longa').optional()
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

const patientListQuerySchema = z.object({
  page: z.string().optional().transform((value) => (value === undefined || value === '' ? 1 : Number(value))),
  limit: z.string().optional().transform((value) => (value === undefined || value === '' ? 20 : Number(value))),
  search: z.string().optional().default('')
}).transform((value) => ({
  page: Number.isFinite(value.page) && value.page > 0 ? value.page : 1,
  limit: Number.isFinite(value.limit) && value.limit > 0 ? Math.min(value.limit, 100) : 20,
  search: (value.search || '').trim()
}));

const getCurrentMonthKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const patientFinancialMonthSchema = z.object({
  month: z.preprocess((value) => {
    if (value === undefined || value === null || String(value).trim() === '') {
      return undefined;
    }
    return value;
  }, z.string().regex(/^\d{4}-\d{2}$/, 'Período inválido').optional())
});

const patientChargeSchema = z.object({
  description: z.string().trim().min(3, 'Descrição obrigatória').max(200, 'Descrição muito longa'),
  periodicity: z.enum(['avulsa', 'semanal', 'mensal']),
  referenceMonth: z.preprocess((value) => {
    if (value === undefined || value === null || String(value).trim() === '') {
      return getCurrentMonthKey();
    }
    return value;
  }, z.string().regex(/^\d{4}-\d{2}$/, 'Período de referência inválido')),
  amountCents: z.preprocess((value) => {
    if (typeof value === 'string') {
      const cleaned = value.replace(/\s/g, '').replace(',', '.');
      if (cleaned === '') return undefined;
      return Number(cleaned);
    }
    return value;
  }, z.number().int().positive('Valor da cobrança deve ser positivo').max(100000000, 'Valor da cobrança muito alto')),
  dueDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Data de vencimento inválida')
});

const patientPaymentSchema = z.object({
  amountCents: z.preprocess((value) => {
    if (typeof value === 'string') {
      const cleaned = value.replace(/\s/g, '').replace(',', '.');
      if (cleaned === '') return undefined;
      return Number(cleaned);
    }
    return value;
  }, z.number().int().positive('Valor do pagamento deve ser positivo').max(100000000, 'Valor do pagamento muito alto')),
  paidAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Data do pagamento inválida').optional(),
  method: z.enum(['pix', 'dinheiro', 'cartao'])
});

const cancelItemSchema = z.object({
  itemId: objectIdSchema,
  type: z.enum(['evolution', 'medicalRecord', 'prescription'])
});

const signItemSchema = z.object({
  itemId: objectIdSchema,
  type: z.enum(['evolution', 'medicalRecord', 'prescription'])
});

module.exports = {
  registerPatientSchema,
  updatePatientSchema,
  medicalRecordSchema,
  evolutionSchema,
  prescriptionSchema,
  patientListQuerySchema,
  patientFinancialMonthSchema,
  patientChargeSchema,
  patientPaymentSchema,
  patientIdParamSchema,
  cancelItemSchema,
  signItemSchema
};
