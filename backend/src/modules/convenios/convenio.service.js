const Convenio = require('./convenio.model.js');

class ConvenioService {
    async create(convenioData) {
        return await Convenio.create(convenioData);
    }

    async findById(convenioId) {
        return await Convenio.findById(convenioId);
    }

    async getConveniosByClinica(clinicaId, onlyActive = true) {
        const filter = { clinicaId };
        if (onlyActive) {
            filter.ativo = true;
        }
        return await Convenio.find(filter).sort({ nome: 1 });
    }

    async getAllConveniosByClinica(clinicaId) {
        return await Convenio.find({ clinicaId }).sort({ nome: 1 });
    }

    async insertMany(conveniosData) {
        return await Convenio.insertMany(conveniosData);
    }

    async findByNomeAndClinica(nome, clinicaId) {
        return await Convenio.findOne({ nome, clinicaId });
    }

    async updateStatus(convenioId, novoStatus) {
        return await Convenio.findByIdAndUpdate(
            convenioId, 
            { ativo: novoStatus }, 
            { new: true }
        );
    }
}

module.exports = new ConvenioService();
