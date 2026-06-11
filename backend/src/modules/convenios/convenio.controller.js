const { ZodError } = require('zod');
const ConvenioService = require('./convenio.service.js');
const { createConvenioSchema, convenioIdParamSchema } = require('./convenio.validator.js');

exports.listConveniosByClinica = async (req, res) => {
    if (!req.clinicaId) {
        return res.status(401).json({ 
            success: false, 
            message: 'Clínica não associada ao usuário' 
        });
    }

    try {
        const convenios = await ConvenioService.getConveniosByClinica(req.clinicaId, true);
        return res.status(200).json({ success: true, convenios });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: 'Erro ao buscar convênios', 
            error: error.message 
        });
    }
};

exports.createConvenio = async (req, res) => {
    try {
        const { nome } = createConvenioSchema.parse(req.body);

        if (!req.clinicaId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Clínica não associada ao usuário' 
            });
        }

        const existente = await ConvenioService.findByNomeAndClinica(nome, req.clinicaId);
        if (existente) {
            return res.status(409).json({ 
                success: false, 
                message: 'Este convênio já existe para esta clínica' 
            });
        }

        const novoConvenio = await ConvenioService.create({
            nome,
            clinicaId: req.clinicaId,
            ativo: true
        });

        return res.status(201).json({ 
            success: true, 
            message: 'Convênio criado com sucesso', 
            convenio: novoConvenio 
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos enviados para criar convênio',
                errors: error.flatten().fieldErrors
            });
        }

        return res.status(500).json({ 
            success: false,
            message: 'Erro ao criar convênio', 
            error: error.message 
        });
    }
};

exports.toggleConvenioStatus = async (req, res) => {
    try {
        const { convenioId } = convenioIdParamSchema.parse(req.params);

        if (!req.clinicaId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Clínica não associada ao usuário' 
            });
        }

        const convenio = await ConvenioService.findById(convenioId);
        
        if (!convenio) {
            return res.status(404).json({ 
                success: false, 
                message: 'Convênio não encontrado' 
            });
        }

        // Verifica se o convênio pertence à clínica do usuário
        if (convenio.clinicaId.toString() !== req.clinicaId.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Acesso negado. Convenio não pertence a sua clínica' 
            });
        }

        const updatedConvenio = await ConvenioService.updateStatus(
            convenioId, 
            !convenio.ativo
        );

        return res.status(200).json({ 
            success: true, 
            message: `Convênio ${updatedConvenio.ativo ? 'ativado' : 'desativado'} com sucesso`, 
            convenio: updatedConvenio 
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos enviados para atualizar convênio',
                errors: error.flatten().fieldErrors
            });
        }

        return res.status(500).json({ 
            success: false,
            message: 'Erro ao atualizar convênio', 
            error: error.message 
        });
    }
};
