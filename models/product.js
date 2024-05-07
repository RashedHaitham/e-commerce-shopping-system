const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: {
    type: String,
    enum: [
      "Electronics",
      "Clothing",
      "Books",
      "Home & Kitchen",
      "Toys",
      "Beauty",
      "Sports",
      "Other",
    ],
    required: true,
  },
  reviews: [
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
    },
  ],
});
productSchema.methods.addReview = function (userId, text, rating) {
  this.reviews.push({
    userId: userId,
    text: text,
    rating: rating,
  });

  return this.save();
};

module.exports = mongoose.model("Product", productSchema);
