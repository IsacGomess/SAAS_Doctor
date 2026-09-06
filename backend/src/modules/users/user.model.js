const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name:{ type: String, required: true },
    email:{ type: String, required: true,unique:true},
    password:{type: String, required: true },
    registroProf:{ type: String},
    specialty:[{name:String,surgeon:String}],
    phone:{ type: String },
    observations:{ type: String },
    role: { type: String, enum: ['administrador', 'medico', 'enfermeiro', 'recepcionista', 'fisioterapeuta', 'nutricionista', 'esteticista', 'dentista', 'nutrologo'], default: 'recepcionista' },
    isActive: { type: Boolean, default: true },
    clinicaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinica', default: null },
    resetPasswordToken: {
    type: String,
    default: null
    },
    tokenVersion: {
    type: Number,
    default: 0
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    }
    
}, { timestamps: true });

// Middleware para hash da senha antes de salvar o usuário
userSchema.pre('save', async function() {
    // Se a senha não foi modificada, apenas segue em frente
    if (!this.isModified('password')) {
        return;
    }
    try {
       
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    
    } catch (err) {
        next(err);
    }
});

const User = mongoose.model('User', userSchema, 'users');


module.exports = User;