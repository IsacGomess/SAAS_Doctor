const { ZodError } = require('zod');
const WaitingLine = require('./waiting-line.model.js');
const Patient = require('../patients/patient.model.js');
const {
  createWaitingLineSchema,
  getWaitingLineQuerySchema,
  idParamSchema,
  updateStatusSchema,
  cancelWaitingLineSchema
} = require('./waiting-line.validator.js');

exports.createWaitingLineEntry = async (req, res) => {
  try {
    const {
      patientId,
      assignedTo,
      priority,
      flowStage,
      clinicArea,
      source,
      estimatedWaitMinutes,
      observations
    } = createWaitingLineSchema.parse(req.body);

    if (!req.clinicaId) {
      return res.status(403).json({
        success: false,
        message: 'Usuário sem clínica associada/No clinic associated'
      });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Paciente não encontrado/Patient not found' });
    }

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
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos enviados para a fila de espera/Invalid data sent to waiting line',
        errors: error.flatten().fieldErrors
      });
    }

    return res.status(500).json({
      message: 'Erro ao criar entrada na fila/Error creating waiting line entry',
      error: error.message
    });
  }
};

exports.getWaitingLine = async (req, res) => {
  if (!req.clinicaId) {
    return res.status(200).json({
      success: true,
      count: 0,
      waitingLine: []
    });
  }

  try {
    const { status, priority, flowStage, clinicArea } = getWaitingLineQuerySchema.parse(req.query);
    const filter = { clinicaId: req.clinicaId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (flowStage) filter.flowStage = flowStage;
    if (clinicArea) filter.clinicArea = clinicArea;

    const waitingLine = await WaitingLine.find(filter)
      .populate({
        path: 'patientId',
        select: 'name convenioId',
        populate: {
          path: 'convenioId',
          select: 'nome'
        }
      })
      .populate('assignedTo', 'name email')
      .sort({ priority: -1, lineNumber: 1 })
      .select('-__v');

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
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos nos filtros da fila de espera/Invalid waiting line filters',
        errors: error.flatten().fieldErrors
      });
    }

    return res.status(500).json({
      message: 'Erro ao obter fila de espera/Error fetching waiting line',
      error: error.message
    });
  }
};

exports.getWaitingLineById = async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

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
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido para consulta da fila/Invalid waiting line ID',
        errors: error.flatten().fieldErrors
      });
    }

    return res.status(500).json({
      message: 'Erro ao obter entrada da fila/Error fetching waiting line entry',
      error: error.message
    });
  }
};

exports.callPatient = async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const entry = await WaitingLine.findByIdAndUpdate(
      id,
      {
        status: 'chamado',
        calledAt: new Date()
      },
      { new: true }
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
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido para chamada de paciente/Invalid patient call ID',
        errors: error.flatten().fieldErrors
      });
    }

    return res.status(500).json({
      message: 'Erro ao chamar paciente/Error calling patient',
      error: error.message
    });
  }
};

exports.updateWaitingLineStatus = async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const { status, observations, assignedTo } = updateStatusSchema.parse(req.body);

    const updateData = { status };
    if (status === 'chamado') updateData.calledAt = new Date();
    if (status === 'em_atendimento') updateData.attendedAt = new Date();
    if (status === 'finalizado') updateData.completedAt = new Date();
    if (observations) updateData.observations = observations;
    if (assignedTo) updateData.assignedTo = assignedTo;

    const entry = await WaitingLine.findByIdAndUpdate(id, updateData, { new: true })
      .populate('patientId', 'name')
      .populate('assignedTo', 'name email');

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
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos para atualização de status/Invalid status update data',
        errors: error.flatten().fieldErrors
      });
    }

    return res.status(500).json({
      message: 'Erro ao atualizar status/Error updating status',
      error: error.message
    });
  }
};

exports.cancelWaitingLine = async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const { cancelledReason } = cancelWaitingLineSchema.parse(req.body);

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
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos para cancelamento/Invalid cancellation data',
        errors: error.flatten().fieldErrors
      });
    }

    return res.status(500).json({
      message: 'Erro ao cancelar entrada na fila/Error cancelling waiting line entry',
      error: error.message
    });
  }
};
