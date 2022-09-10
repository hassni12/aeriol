const mongoose = require("mongoose");
const user = require("./User.model");
const product = require("./product.model");
const WishListSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: user,
  },
  product: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: product,
    },
  ],
});

WishListSchema.set("timestamps", true);

module.exports = WishList = mongoose.model("WishList", WishListSchema);
