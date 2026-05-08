const mongoose = require('mongoose');



const dataPatients = new mongoose.Schema({ 
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quickHistory:[{ 
        comorbidities:[{
            diesease:String,
            status:{type:String, enum:['controlled','uncontrolled']},
            observation:String
        }],
    }],
    prescription:[{
        medicationName:String,
        dosage:String,
        frequency:String,
        duration:String,
        observation:String
    }],
    timeLine:[{
        date: { type: Date, default: Date.now },
        description:{String},
        type:{ type: String, enum: ['consultation', 'procedure', 'exam', 'other'] },
    }]
}, { timestamps: true });

const DataPatient = mongoose.model('DataPatient', dataPatients, 'data_patients');

module.exports = DataPatient;