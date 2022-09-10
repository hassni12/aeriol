const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("config");
const locationSchema = new mongoose.Schema({
  type: {
    type: String, // Don't do `{ location: { type: String } }`
    enum: ["Point"], // 'location.type' must be 'Point'
  },
  coordinates: {
    type: [Number],
    index: "2dsphere",
  },
});
const UserSchema = new mongoose.Schema({
  image: {
    type: String,
  },
  firstname: {
    type: String,
  },
  lastname: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true,
  },
  password: {
    type: String,
  },

  resetCode: { type: Number, default: "" },
  status: { type: Number, default: 1 },

  averageRating: {
    type: Number,
    default: 0,
  },
  city: {
    type: String,
    default: null,
  },
  country: {
    type: String,
    default: null,
  },
  state: {
    type: String,
    default: null,
  },
  zip_code: {
    type: String,
    default: null,
  },
  address: {
    type: String,
    default: null,
  },
  phone_no: {
    type: String,
    default: null,
  },
  location: {
    type: locationSchema,
  },

  googleId: {
    type: String,
    default: null,
  },
  facebookId: {
    type: String,
    default: null,
  },
  appleId: {
    type: String,
    default: null,
  },
  is_subscribed: {
    type: String,
    default: false,
  },
  role: {
    type: String,
    enum: ["USER", "ADMIN", "HEALER"],
    default: "USER",
  },
});

UserSchema.set("timestamps", true);

UserSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      role: this.role,
      status: this.status,
    },
    config.get("jwtSecret"),
    { expiresIn: "24h" }
  );
  return token;
};

module.exports = User = mongoose.model("user", UserSchema);
