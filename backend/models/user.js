const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{ type: String, required: true },
    email:{ type: String, required: true,unique:true},
    password:{type: String, required: true },
    crm:{ type: String},
    specialty:[{name:String,surgeon:String}],
    phone:{ type: String },
    observatiosn:{ type: String },
    isActive: { type: Boolean, default: true }
    
}, { timestamps: true });


const User = mongoose.model('User', userSchema, 'users');


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
