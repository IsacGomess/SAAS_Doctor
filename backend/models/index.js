const Patient = require('./patient');
const MedicalRecord = require('./medicalRecord');
const Prescription = require('./prescription');
const Evolution = require('./evolution');
const User = require('./user');
const WaitingLine = require('./flow-clinic/waiting-line');
const Clinica = require('./clinica');

module.exports = {
    Patient,
    MedicalRecord,
    Prescription,
    Evolution,
    User,
    WaitingLine,
    Clinica,
};