const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{ type: String, required: true },
    email:{ type: String, required: true,unique:true},
    password:{type: String, required: true },
    role:{type: String,
        enum:['doctor','patient'],
        default:'doctor'
    },
    crm:{ type: String},
    specialty:[{name:String,surgeon:String}],
    phone:{ type: String },
    observatiosn:{ type: String },
    belongsToDoctor:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true }
    
}, { timestamps: true });


const User = mongoose.model('User', userSchema, 'users');

// Middleware para limpar campos específicos com base no papel do usuário
userSchema.pre('save',  function(next) {
    if(this.role === 'doctor'){
        this.belongsToDoctor = undefined;
        this.crm = { type: String, required: true };
    }
    next();
});

// Middleware para limpar campos específicos com base no papel do usuário
userSchema.pre('save',  function(next) {
    if(this.role === 'patient'){
        this.crm = undefined;
        this.specialty = undefined;
    }
    next();
});
// Middleware para hash da senha antes de salvar o usuário
userSchema.pre('save', function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = bycrypt.genSaltSync(10);
    this.password = bycrypt.hashSync(this.password, salt);
    next();
});



module.exports = User;