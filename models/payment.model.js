const mongoose = require("mongoose");
const payment = new mongoose.Schema({

  
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: true
    },
    charge_id: {
        type: String
    },
    payload: {
        type: String
    },
    amount: {
        type: String
    },
    status: {
        type: String

    },
    type: {
        type: String
    },
    method:{
        type:String
    },
    is_expired : {
        type:String,
        default:false


    }
});

payment.set('timestamps', true)

module.exports = Payment = mongoose.model("Payment", payment)