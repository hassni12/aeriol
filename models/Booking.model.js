const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BooingSchema = new Schema(
  {
    healer: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    date: {
      type: Date,
      required:true
    },
    time: {
      type: String,
      
    },
    endtime: {
      type: String,
      
    },
  
    status: {
      type: String,
      default: "Pending",
      },
      payment_method : {
        type:String,
        default:null
        
      }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", BooingSchema);