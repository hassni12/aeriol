const mongoose = require('mongoose');
const Product = require('./product.model')
const User = require('./User.model')
const mongoosePaginate = require("mongoose-paginate-v2");

const locationSchema = new mongoose.Schema({
  type: {
    type: String, // Don't do `{ location: { type: String } }`
    enum: ['Point'], // 'location.type' must be 'Point'

  },
  coordinates: {
    type: [Number],
    index: '2dsphere'

  }

})
const orderSchema = new mongoose.Schema(
  {
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },

        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: Product,
          required: true,
        },


      },
    ],
    shippingAddress: {
      firstname: { type: String, required: true },
      lastname: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, default: null },
      zip_code: { type: String, default: null },
      country: { type: String, default: null },
      Location: {
        type: locationSchema,
        default: null
      },

    },
    ship_to_a_different_address: {
      type: Boolean, required: true
    },
    billingAddress: {
      firstname: { type: String, default: null },
      lastname: { type: String, default: null },
      address: { type: String, default: null },
      city: { type: String, default: null },
      zip_code: { type: String, default: null },
      country: { type: String, default: null },
      Location: {
        type: locationSchema,
        default: null

      },
    },
    paymentMethod: { type: String, required: true },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: User, required: true },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    status: { type: String, default: "received" },


  },
  {
    timestamps: true,
  }
);
orderSchema.plugin(mongoosePaginate);

module.exports = Order = mongoose.model("Order", orderSchema)