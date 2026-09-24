const { z } = require('zod');

const objectIdSchema = z.string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ID de usuário inválido');

const registerSchema = z.object({
  name: z.string()
    .trim()
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .max(100, 'O nome não pode passar de 100 caracteres'),
  email: z.string()
    .trim()
    .email('Formato de e-mail inválido')
    .max(150, 'O e-mail é longo demais')
    .transform(val => val.toLowerCase()),
  password: z.string()
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
    "Senha fraca")
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .max(100, 'A senha é longa demais'),
  registroProf: z.string()
    .trim()
    .min(4, 'Registro inválido')
    .max(15, 'Registro longo demais')
    .optional()
});

const loginSchema = z.object({
  email: z.string()
    .trim()
    .email('Formato de e-mail inválido')
    .transform(val => val.toLowerCase()),
  password: z.string().min(6, 'A senha é obrigatória').max(50, 'A senha é longa demais')
});

const normalizeOptionalRegistration = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const addMembroSchema = z.object({
  name: z.string()
    .trim()
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .max(100, 'O nome não pode passar de 100 caracteres'),
  email: z.string()
    .trim()
    .email('Formato de e-mail inválido')
    .max(150, 'O e-mail é longo demais')
    .transform(val => val.toLowerCase()),
  password: z.string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .max(100, 'A senha é longa demais'),
  role: z.enum(['medico', 'enfermeiro', 'recepcionista', 'fisioterapeuta', 'nutricionista', 'esteticista', 'dentista', 'nutrologo'], {
    errorMap: () => ({ message: 'Cargo inválido. Aceitos: medico, enfermeiro, recepcionista, fisioterapeuta, nutricionista, esteticista, dentista, nutrologo' })
  }),
  registroProf: z.preprocess(
    normalizeOptionalRegistration,
    z.string().trim().min(4, 'Registro inválido').max(15, 'Registro longo demais').optional()
  )
});

// Caso o membro não seja recepcionista, o campo registroProf é obrigatório
const addMembroSchemaWithRegistro = addMembroSchema.refine((data) => {
  if (!data) return false;
  if (data.role === 'recepcionista') return true;
  return typeof data.registroProf === 'string' && data.registroProf.trim().length >= 4;
}, {
  message: 'registroProf é obrigatório para membros que não sejam recepcionistas',
  path: ['registroProf']
});
const membroIdParamSchema = z.object({
  membroId: objectIdSchema
});

const forgotPasswordSchema = z.object({
    email: z
        .string()
        .trim()
        .email('E-mail inválido')
        .transform((value) => value.toLowerCase())
});

const resetPasswordSchema = z.object({
    password: z
        .string()
        .min(8, 'A senha deve ter pelo menos 8 caracteres')
        .regex(/[A-Z]/, 'A senha deve conter uma letra maiúscula')
        .regex(/[a-z]/, 'A senha deve conter uma letra minúscula')
        .regex(/[0-9]/, 'A senha deve conter um número')
});

const parseOptionalCurrency = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().replace(/\./g, '').replace(',', '.');
    if (normalized === '') return null;
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? Number.NaN : parsed;
  }
  return Number.NaN;
};

const updateMeSchema = z.object({
  registroProf: z.string().trim().max(40, 'Registro profissional muito longo').optional().nullable(),
  profissao: z.string().trim().max(80, 'Profissão muito longa').optional().nullable(),
  conselhoProfissional: z.string().trim().max(60, 'Conselho profissional muito longo').optional().nullable(),
  conselhoUf: z.string().trim().toUpperCase().length(2, 'UF do conselho deve ter 2 letras').optional().nullable(),
  numeroRegistroProfissional: z.string().trim().max(30, 'Número de registro muito longo').optional().nullable(),
  valorParticularPadrao: z.preprocess(parseOptionalCurrency, z.number().min(0, 'Valor particular deve ser não negativo').nullable().optional())
});

module.exports = {
  registerSchema,
  loginSchema,
  addMembroSchema,
  addMembroSchemaWithRegistro,
  membroIdParamSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateMeSchema
};

