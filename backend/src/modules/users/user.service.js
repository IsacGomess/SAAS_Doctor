const User = require('./user.model');

class UserService{

    async associateClinicAndMakeAdmin(userId,clinicaId){
        return await User.findByIdAndUpdate(
            userId,
            {clinicaId, role:'administrador'},
            {new :true}
        )
    }
}

module.exports = new UserService();