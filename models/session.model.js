const mongoose = require('mongoose');
const user  = require('./User.model')

const sessionSchema = new mongoose.Schema({
    token: {
        type: String,
       
        
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: user
    },
    status: {
        type: Boolean,
        default: false
    },
    deviceId:{
        type: String,
        default:null
    },
    deviceType:{
        type: String,
        default:null
    }

});

sessionSchema.set('timestamps',true)




module.exports=  session = mongoose.model('session', sessionSchema);
