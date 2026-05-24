const { WaitingLine, Patient } = require('../models');
const { z } = require('zod');

// Schema Zod para validação de entrada na fila de espera
const createWaitingLineSchema = z.object({
    patientId: z.string()
        .refine(val => val.length === 24, "ID do paciente inválido"),
    
    assignedTo: z.string()
        .refine(val => val.length === 24, "ID do usuário inválido")
        .optional(),
    
    priority: z.enum(['normal', 'prioritario', 'emergencia'])
        .default('normal'),
    
    flowStage: z.enum(['recepcao', 'triagem', 'espera', 'consulta', 'retorno', 'internacao'])
        .default('espera'),
    
    clinicArea: z.string()
        .min(1, "Área da clínica é obrigatória")
        .optional(),
    
    source: z.enum(['avulso', 'consulta_agendada', 'emergencia'])
        .default('avulso'),
    
    estimatedWaitMinutes: z.number()
        .positive("Tempo estimado deve ser positivo")
        .optional(),
    
    observations: z.string()
        .max(500, "As observações não podem passar de 500 caracteres")
        .optional()
        .transform(val => val ? val.trim() : "")
});

// Schema para atualizar status
const updateStatusSchema = z.object({
    status: z.enum(['aguardando', 'chamado', 'em_atendimento', 'finalizado', 'cancelado']),
    observations: z.string().optional()
});

// Schema para cancelamento
const cancelWaitingLineSchema = z.object({
    cancelledReason: z.string()
        .min(3, "Motivo do cancelamento deve ter pelo menos 3 caracteres")
        .max(250, "Motivo não pode passar de 250 caracteres")
});

// Criar entrada na fila de espera
exports.createWaitingLineEntry = async (req, res) => {
    const validation = createWaitingLineSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos enviados para a fila de espera/Invalid data sent to waiting line',
            errors: validation.error.flatten().fieldErrors
        });
    }

    try {
        const { patientId, assignedTo, priority, flowStage, clinicArea, source, estimatedWaitMinutes, observations } = validation.data;

        // Verifica se o paciente existe
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Paciente não encontrado/Patient not found' });
        }

        if (!req.clinicaId) {
            return res.status(403).json({
                success: false,
                message: 'Usuário sem clínica associada/No clinic associated'
            });
        }

        // Gera número da fila apenas dentro da clínica do usuário
        const lastEntry = await WaitingLine.findOne({ clinicaId: req.clinicaId }).sort({ lineNumber: -1 });
        const nextLineNumber = lastEntry ? lastEntry.lineNumber + 1 : 1;

        const newEntry = await WaitingLine.create({
            patientId,
            assignedTo,
            lineNumber: nextLineNumber,
            clinicaId: req.clinicaId,
            priority,
            flowStage,
            clinicArea,
            source,
            estimatedWaitMinutes,
            observations
        });

        return res.status(201).json({
            success: true,
            message: 'Entrada na fila criada com sucesso/Waiting line entry created successfully',
            entry: newEntry
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Erro ao criar entrada na fila/Error creating waiting line entry',
            error: error.message
        });
    }
};

// Listar fila de espera com filtros opcionais
exports.getWaitingLine = async (req, res) => {
    if (!req.clinicaId) {
        return res.status(200).json({
            success: true,
            count: 0,
            waitingLine: []
        });
    }

    try {
        const { status, priority, flowStage, clinicArea } = req.query;
        const filter = { clinicaId: req.clinicaId };
        // inserindo dados do front no filter 
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (flowStage) filter.flowStage = flowStage;
        if (clinicArea) filter.clinicArea = clinicArea;

        const waitingLine = await WaitingLine.find(filter)
            .populate('patientId', 'name ')
            .populate('assignedTo', 'name email')
            .sort({ priority: -1, lineNumber: 1 })
            .select('-__v'); // metodo para esconder campo 

        if (!waitingLine || waitingLine.length === 0) {
            return res.status(404).json({
                success: true,
                message: 'Nenhuma entrada na fila de espera/No waiting line entries found',
                count: 0
            });
        }

        return res.status(200).json({
            success: true,
            count: waitingLine.length,
            waitingLine
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Erro ao obter fila de espera/Error fetching waiting line',
            error: error.message
        });
    }
};

// Obter entrada específica da fila
exports.getWaitingLineById = async (req, res) => {
    try {
        const { id } = req.params;

        const entry = await WaitingLine.findById(id)
            .populate('patientId', 'name observations')
            .populate('assignedTo', 'name email specialization');

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Entrada na fila não encontrada/Waiting line entry not found'
            });
        }

        return res.status(200).json({ success: true, entry });
    } catch (error) {
        return res.status(500).json({
            message: 'Erro ao obter entrada da fila/Error fetching waiting line entry',
            error: error.message
        });
    }
};

// Chamar paciente (atualizar status para 'chamado')
exports.callPatient = async (req, res) => {
    try {
        const { id } = req.params;

        const entry = await WaitingLine.findByIdAndUpdate(
            id,
            {
                status: 'chamado',
                calledAt: new Date()
            },
            { new: true } // atualizando o documento
        ).populate('patientId', 'name');

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Entrada na fila não encontrada/Waiting line entry not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Paciente chamado com sucesso/Patient called successfully',
            entry
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Erro ao chamar paciente/Error calling patient',
            error: error.message
        });
    }
};

// Atualizar status da entrada na fila
exports.updateWaitingLineStatus = async (req, res) => {
    const validation = updateStatusSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos/Invalid data',
            errors: validation.error.flatten().fieldErrors
        });
    }

    try {
        const { id } = req.params;
        const { status, observations } = validation.data;

        const updateData = { status };

        // Define timestamps baseado no status
        if (status === 'chamado') updateData.calledAt = new Date();
        if (status === 'em_atendimento') updateData.attendedAt = new Date();
        if (status === 'finalizado') updateData.completedAt = new Date();

        if (observations) updateData.observations = observations;

        const entry = await WaitingLine.findByIdAndUpdate(id, updateData, { new: true })
            .populate('patientId', 'name');

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Entrada na fila não encontrada/Waiting line entry not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Status atualizado com sucesso/Status updated successfully',
            entry
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Erro ao atualizar status/Error updating status',
            error: error.message
        });
    }
};

// Cancelar entrada na fila
exports.cancelWaitingLine = async (req, res) => {
    const validation = cancelWaitingLineSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos/Invalid data',
            errors: validation.error.flatten().fieldErrors
        });
    }

    try {
        const { id } = req.params;
        const { cancelledReason } = validation.data;

        const entry = await WaitingLine.findByIdAndUpdate(
            id,
            {
                status: 'cancelado',
                cancelledReason,
                completedAt: new Date()
            },
            { new: true }
        ).populate('patientId', 'name phone');

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Entrada na fila não encontrada/Waiting line entry not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Entrada na fila cancelada com sucesso/Waiting line entry cancelled successfully',
            entry
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Erro ao cancelar entrada na fila/Error cancelling waiting line entry',
            error: error.message
        });
    }
};