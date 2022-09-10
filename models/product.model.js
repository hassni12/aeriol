const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mongoosePaginate = require("mongoose-paginate-v2");

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
 
    price: {
      type: Number,
      required: true,
    },
    shipment: {
      type: Number,
      required: true,
    },
   
    stock: {
      type: Number,
      required: true,
    },
    images: [String],
    specifications: {
      type: String,
      required: true,
    },
    avgRatings: {
      type: Number,
      default: 0,
    },
    status: {
      type: Boolean,
      default: true,
    },
    
   
  },
  { timestamps: true }
);

productSchema.plugin(mongoosePaginate);
productSchema.index({ name: "text" });

module.exports = mongoose.model("Product", productSchema);