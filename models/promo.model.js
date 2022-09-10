const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const promoScehma = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },

  start_date: {
    type: Date,
    required: true,
  },
  end_date: {
    type: Date,
    required: true,
  },

  status: {
    type: Boolean,
    default: true,
  },
  discount_type: {
    type: String,
    required: true,
  },
  discount_value: {
    type: String,
    required: true,
  },
  user_limit:{
    type:Number,
    required: true,

  }

});
promoScehma.set("timestamps", true);
promoScehma.plugin(mongoosePaginate);

module.exports = Package = mongoose.model("Promo", promoScehma);
