const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default:true,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    totalProducts: {
      type: Number,
      default: 0,
    },
    
  },
  { timestamps: true }
);

categorySchema.plugin(mongoosePaginate);
categorySchema.index({ name: "text" });

module.exports = mongoose.model("Category", categorySchema);