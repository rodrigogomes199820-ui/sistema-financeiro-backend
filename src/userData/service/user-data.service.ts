import User from "../../models/user.model";


class UserDataService {

async getProfile(userId: string){

     const user = await User.findById(userId)
     .select('-password -resetPasswordToken -resetPasswordExpires');

     if(!user){
        throw new Error('Usuario não encontrado')
     }

     return user;
     

}











}

export default new UserDataService();