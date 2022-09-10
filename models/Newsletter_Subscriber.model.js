const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
const mongoosePaginate = require("mongoose-paginate-v2");
const NewsLetter = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  status: { type: String, required: true },
});
NewsLetter.set("timestamps", true);
NewsLetter.plugin(mongoosePaginate);

module.exports = NewsLetter_Subscriber = mongoose.model(
  "NewsLetter_Subscriber",
  NewsLetter
);
