const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { Clinica, User } = require('../../../models');

const createClinicaSchema = z.object({
    name: z.string().min(3, 'Nome da clínica deve ter pelo menos 3 caracteres').max(120, 'Nome muito longo').trim(),
    cnpj: z.string().trim().optional(),
    address: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.string().trim().email('E-mail inválido').toLowerCase().optional()
});

exports.createClinica = async (req, res) => {
    if (!req.userId) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado/User not authenticated' });
    }

    const validation = createClinicaSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos para criação da clínica/Invalid clinic data',
            errors: validation.error.flatten().fieldErrors
        });
    }

    try {
        const { name, cnpj, address, phone, email } = validation.data;

        const clinica = await Clinica.create({
            name,
            cnpj,
            address,
            phone,
            email,
            donoId: req.userId
        });

        const user = await User.findByIdAndUpdate(
            req.userId,
            { clinicaId: clinica._id, role: 'administrador' },
            { new: true }
        );

        const accessToken = jwt.sign(
            { userId: user._id, name: user.name, clinicaId: user.clinicaId || null },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.status(201).json({
            success: true,
            message: 'Clínica criada com sucesso/Clinic created successfully',
            clinica,
            accessToken,
            user: {
                name: user.name,
                clinicaId: user.clinicaId || null
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Erro ao criar clínica/Error creating clinic',
            error: error.message
        });
    }
};

exports.getMyClinica = async (req, res) => {
    if (!req.clinicaId) {
        return res.status(404).json({
            success: false,
            message: 'Usuário ainda não possui clínica associada/User has no clinic associated'
        });
    }

    try {
        const clinica = await Clinica.findById(req.clinicaId);
        if (!clinica) {
            return res.status(404).json({ success: false, message: 'Clínica não encontrada/Clinic not found' });
        }

        return res.status(200).json({ success: true, clinica });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao buscar clínica/Error fetching clinic', error: error.message });
    }
};
