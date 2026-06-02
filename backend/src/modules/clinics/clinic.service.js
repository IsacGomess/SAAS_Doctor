const Clinica = require('./clinic.model');

class ClinicService {
    async create(clinicData,donoId){
        return await Clinica.create({
            ...clinicData,
            donoId
        });
    }

    async findById(clinicId){
        return await Clinica.findById(clinicId);
    }
}
module.exports = new ClinicService();