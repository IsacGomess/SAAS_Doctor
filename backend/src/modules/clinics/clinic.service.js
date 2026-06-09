const Clinica = require('./clinic.model');
const ConvenioService = require('../convenios/convenio.service.js');

// Convênios padrão para serem inseridos ao criar uma clínica
const DEFAULT_CONVENIOS = [
    'Unimed',
    'Bradesco Saúde',
    'Amil',
    'SulAmérica',
    'Cassi',
    'Golden Cross'
];

class ClinicService {
    async create(clinicData, donoId) {
        const clinica = await Clinica.create({
            ...clinicData,
            donoId
        });

        // Insere automaticamente os convênios padrão vinculados à clínica
        try {
            const conveniosData = DEFAULT_CONVENIOS.map(nome => ({
                nome,
                clinicaId: clinica._id,
                ativo: true
            }));
            await ConvenioService.insertMany(conveniosData);
        } catch (error) {
            console.error('Erro ao inserir convênios padrão:', error.message);
            // Não falha a criação da clínica se os convênios não forem inseridos
        }

        return clinica;
    }

    async findById(clinicId) {
        return await Clinica.findById(clinicId);
    }
}
module.exports = new ClinicService();