const { z } = require('zod');

const createClinicaSchema = z.object({
  name: z.string()
    .trim()
    .min(3, 'Nome da clínica deve ter pelo menos 3 caracteres')
    .max(120, 'Nome da clínica é muito longo'),
  cnpj: z.string().trim().optional(),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string()
    .trim()
    .email('E-mail inválido')
    .transform(val => val.toLowerCase())
    .optional()
});

module.exports = {
  createClinicaSchema
};
