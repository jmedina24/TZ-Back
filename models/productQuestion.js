// models/ProductQuestion.js
const mongoose = require("mongoose");

const ProductQuestionSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: { type: String, required: true, trim: true, maxlength: 500 },

    answer: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ["pending", "answered"],
      default: "pending",
    },

    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    answeredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductQuestion", ProductQuestionSchema);
