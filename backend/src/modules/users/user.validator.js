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
});

const loginSchema = z.object({
  email: z.string()
    .trim()
    .email('Formato de e-mail inválido')
    .transform(val => val.toLowerCase()),
  password: z.string().min(6, 'A senha é obrigatória').max(50, 'A senha é longa demais')
});

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
  })
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

module.exports = {
  registerSchema,
  loginSchema,
  addMembroSchema,
  membroIdParamSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};

