const jwt = require('jsonwebtoken');
const { ZodError } = require('zod');
const ClinicService = require('./clinic.service.js');
const UserService = require('../users/user.service.js');
const { createClinicaSchema } = require('./clinic.validator.js');

exports.createClinica = async (req, res) => {
    try {
        const validatedBody = createClinicaSchema.parse(req.body);

        if (!req.userId) {
            return res.status(401).json({ success: false, message: 'Usuário não autenticado/User not authenticated' });
        }

        const clinica = await ClinicService.create(validatedBody, req.userId);

        const user = await UserService.associateClinicAndMakeAdmin(req.userId,clinica._id);

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
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos para criação da clínica/Invalid clinic data',
                errors: error.flatten().fieldErrors
            });
        }

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
        const clinica = await ClinicService.findById(req.clinicaId);
        if (!clinica) {
            return res.status(404).json({ success: false, message: 'Clínica não encontrada/Clinic not found' });
        }

        return res.status(200).json({ success: true, clinica });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao buscar clínica/Error fetching clinic', error: error.message });
    }
};
