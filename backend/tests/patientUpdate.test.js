const test = require('node:test');
const assert = require('node:assert/strict');

const patientController = require('../src/modules/patients/patient.controller');
const mongoose = require('mongoose');
const PatientCharge = require('../src/modules/patients/patient-financial.model.js');
const { updatePatientSchema, patientChargeSchema, patientFinancialMonthSchema } = require('../src/modules/patients/patient.validator');

test('patient controller exposes updatePatient action', () => {
  assert.equal(typeof patientController.updatePatient, 'function');
});

test('update patient schema accepts valid partial updates', () => {
  const result = updatePatientSchema.parse({
    name: 'João Silva',
    cpf: '11122233344',
    phone: '81999999999',
    idade: 31,
    observations: 'Consulta revisada',
    convenioId: null
  });

  assert.equal(result.name, 'João Silva');
  assert.equal(result.cpf, '11122233344');
  assert.equal(result.phone, '81999999999');
});

test('patient charge schema accepts numeric strings from form inputs', () => {
  const result = patientChargeSchema.parse({
    description: 'Consulta de retorno',
    periodicity: 'mensal',
    referenceMonth: '2026-09',
    amountCents: '15000',
    dueDate: '2026-09-30'
  });

  assert.equal(result.amountCents, 15000);
  assert.equal(result.referenceMonth, '2026-09');
});

test('financial month schema accepts empty or undefined month values', () => {
  const emptyResult = patientFinancialMonthSchema.parse({ month: '' });
  const undefinedResult = patientFinancialMonthSchema.parse({});

  assert.equal(emptyResult.month, undefined);
  assert.equal(undefinedResult.month, undefined);
});

test('patient charge schema defaults to current month when referenceMonth is empty', () => {
  const now = new Date();
  const expectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const result = patientChargeSchema.parse({
    description: 'Consulta de retorno',
    periodicity: 'mensal',
    referenceMonth: '',
    amountCents: '15000',
    dueDate: '2026-09-30'
  });

  assert.equal(result.referenceMonth, expectedMonth);
});

test('patient charge document validates without crashing in the pre-validate hook', async () => {
  const patientId = new mongoose.Types.ObjectId();
  const profissionalId = new mongoose.Types.ObjectId();

  const charge = new PatientCharge({
    patientId,
    clinicaId: null,
    profissionalId,
    description: 'Consulta de retorno',
    periodicity: 'mensal',
    referenceMonth: '2026-09',
    amountCents: 15000,
    dueDate: new Date('2030-09-30'),
    payments: [],
    status: 'pendente',
    overdue: false
  });

  await charge.validate();
  assert.equal(charge.status, 'pendente');
  assert.equal(charge.overdue, false);
});
