const mongoose = require('mongoose');

const paymentEntrySchema = new mongoose.Schema({
  amountCents: { type: Number, required: true, min: 1 },
  paidAt: { type: Date, required: true, default: Date.now },
  method: { type: String, enum: ['pix', 'dinheiro', 'cartao'], required: true }
}, { _id: true, timestamps: true });

const patientChargeSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  clinicaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinica', default: null },
  profissionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  description: { type: String, required: true, trim: true, maxlength: 200 },
  periodicity: { type: String, enum: ['avulsa', 'semanal', 'mensal'], default: 'avulsa' },
  referenceMonth: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
  amountCents: { type: Number, required: true, min: 1 },
  dueDate: { type: Date, required: true },
  payments: { type: [paymentEntrySchema], default: [] },
  status: { type: String, enum: ['pendente', 'parcial', 'pago'], default: 'pendente' },
  overdue: { type: Boolean, default: false }
}, { timestamps: true });

patientChargeSchema.index({ patientId: 1, referenceMonth: 1, dueDate: 1 });
patientChargeSchema.index({ clinicaId: 1, profissionalId: 1, patientId: 1 });

patientChargeSchema.pre('validate', function preValidate() {
  if (!this.payments || !Array.isArray(this.payments)) {
    this.payments = [];
  }

  const paidAmount = this.payments.reduce((sum, payment) => sum + Number(payment.amountCents || 0), 0);
  const balance = Number(this.amountCents || 0) - paidAmount;

  if (balance <= 0) {
    this.status = 'pago';
    this.overdue = false;
  } else if (paidAmount > 0) {
    this.status = 'parcial';
    this.overdue = this.dueDate && new Date(this.dueDate) < new Date() && balance > 0;
  } else {
    this.status = 'pendente';
    this.overdue = Boolean(this.dueDate && new Date(this.dueDate) < new Date());
  }
});

const PatientCharge = mongoose.models.PatientCharge || mongoose.model('PatientCharge', patientChargeSchema, 'patient_charges');

module.exports = PatientCharge;
