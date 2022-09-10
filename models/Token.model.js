const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const tokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  token: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now, expires: 43200 }
});


module.exports = Token = mongoose.model("Token", tokenSchema)