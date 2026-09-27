const test = require('node:test');
const assert = require('node:assert/strict');

const patientController = require('../src/modules/patients/patient.controller');
const PatientService = require('../src/modules/patients/patient.service');
const Evolution = require('../src/modules/patients/evolution.model');
const MedicalRecord = require('../src/modules/patients/medicalRecord.model');
const Prescription = require('../src/modules/patients/prescription.model');

const originalFindAccessiblePatient = PatientService.findAccessiblePatient;
const originalSignItem = PatientService.signItem;
const originalEvolutionFindOne = Evolution.findOne;
const originalMedicalRecordFindOne = MedicalRecord.findOne;
const originalPrescriptionFindOne = Prescription.findOne;
const originalEvolutionFindOneAndUpdate = Evolution.findOneAndUpdate;

function makeReqRes({ patientId = '507f1f77bcf86cd799439011', itemId = '507f191e810c19729de860ea', type = 'evolution' } = {}, user = {}) {
  const req = {
    params: { patientId },
    body: { itemId, type },
    userId: user.userId || '507f191e810c19729de860eb',
    clinicaId: user.clinicaId || null,
    user: {
      role: user.role || 'fisioterapeuta'
    }
  };

  let statusCode = 200;
  let payload = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
      return this;
    },
    get statusCode() {
      return statusCode;
    },
    get payload() {
      return payload;
    }
  };

  return { req, res };
}

function makeDoc({
  belongsTo = '507f191e810c19729de860eb',
  canceled = false,
  signed = false
} = {}) {
  return {
    belongsTo: {
      toString: () => belongsTo
    },
    canceled,
    signingRecord: signed ? { completed: true } : { completed: false }
  };
}

function setDefaultModelFindOne(doc) {
  Evolution.findOne = async () => doc;
  MedicalRecord.findOne = async () => doc;
  Prescription.findOne = async () => doc;
}

test('signItem accepts signature session for medicalRecord, evolution and prescription', async () => {
  const signedDoc = {
    _id: '507f191e810c19729de860ea',
    signingRecord: {
      completed: true,
      method: 'signature_screen'
    }
  };

  PatientService.findAccessiblePatient = async () => ({ _id: '507f1f77bcf86cd799439011' });
  PatientService.signItem = async () => signedDoc;
  setDefaultModelFindOne(makeDoc());

  for (const type of ['medicalRecord', 'evolution', 'prescription']) {
    const { req, res } = makeReqRes({ type });
    await patientController.signItem(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.success, true);
    assert.equal(res.payload.item.signingRecord.completed, true);
  }
});

test('signItem returns 404 when patient is outside current context', async () => {
  PatientService.findAccessiblePatient = async () => null;

  const { req, res } = makeReqRes({ type: 'evolution' });
  await patientController.signItem(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.payload.success, false);
});

test('signItem returns 404 when item does not belong to patient', async () => {
  PatientService.findAccessiblePatient = async () => ({ _id: '507f1f77bcf86cd799439011' });
  setDefaultModelFindOne(null);

  const { req, res } = makeReqRes({ type: 'medicalRecord' });
  await patientController.signItem(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.payload.success, false);
});

test('signItem rejects canceled item', async () => {
  PatientService.findAccessiblePatient = async () => ({ _id: '507f1f77bcf86cd799439011' });
  setDefaultModelFindOne(makeDoc({ canceled: true }));

  const { req, res } = makeReqRes({ type: 'prescription' });
  await patientController.signItem(req, res);

  assert.equal(res.statusCode, 409);
  assert.equal(res.payload.success, false);
});

test('signItem rejects already signed item', async () => {
  PatientService.findAccessiblePatient = async () => ({ _id: '507f1f77bcf86cd799439011' });
  setDefaultModelFindOne(makeDoc({ signed: true }));

  const { req, res } = makeReqRes({ type: 'evolution' });
  await patientController.signItem(req, res);

  assert.equal(res.statusCode, 409);
  assert.equal(res.payload.success, false);
});

test('signItem keeps ownership restriction in clinic context', async () => {
  PatientService.findAccessiblePatient = async () => ({ _id: '507f1f77bcf86cd799439011' });
  setDefaultModelFindOne(makeDoc({ belongsTo: '507f191e810c19729de860ff' }));

  const { req, res } = makeReqRes({ type: 'evolution' }, { clinicaId: '507f191e810c19729de860aa', role: 'fisioterapeuta' });
  await patientController.signItem(req, res);

  assert.equal(res.statusCode, 403);
  assert.equal(res.payload.success, false);
});

test('signItem rejects invalid type with 400', async () => {
  PatientService.findAccessiblePatient = async () => ({ _id: '507f1f77bcf86cd799439011' });

  const { req, res } = makeReqRes({ type: 'other' });
  await patientController.signItem(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.success, false);
});

test('signItem service sets backend timestamp and recordedBy from userId', async () => {
  PatientService.signItem = originalSignItem;

  let capturedFilter = null;
  let capturedUpdate = null;

  Evolution.findOneAndUpdate = (filter, update) => {
    capturedFilter = filter;
    capturedUpdate = update;

    return {
      populate: async () => ({
        _id: '507f191e810c19729de860ea',
        signingRecord: {
          completed: true,
          completedAt: update.$set['signingRecord.completedAt'],
          recordedBy: update.$set['signingRecord.recordedBy'],
          method: 'signature_screen'
        }
      })
    };
  };

  const result = await PatientService.signItem(
    '507f1f77bcf86cd799439011',
    'evolution',
    '507f191e810c19729de860ea',
    '507f191e810c19729de860eb'
  );

  assert.equal(capturedFilter._id, '507f191e810c19729de860ea');
  assert.equal(capturedFilter.patientId, '507f1f77bcf86cd799439011');
  assert.equal(capturedUpdate.$set['signingRecord.recordedBy'], '507f191e810c19729de860eb');
  assert.ok(capturedUpdate.$set['signingRecord.completedAt'] instanceof Date);
  assert.equal(result.signingRecord.method, 'signature_screen');
});

process.on('exit', () => {
  PatientService.findAccessiblePatient = originalFindAccessiblePatient;
  PatientService.signItem = originalSignItem;
  Evolution.findOne = originalEvolutionFindOne;
  MedicalRecord.findOne = originalMedicalRecordFindOne;
  Prescription.findOne = originalPrescriptionFindOne;
  Evolution.findOneAndUpdate = originalEvolutionFindOneAndUpdate;
});
