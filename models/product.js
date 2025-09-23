const mongoose = require("mongoose");

const ProductSchema = mongoose.Schema(
  {
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      require: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    cover: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    discount_percentaje: {
      type: Number,
      default: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
    categoryId: {
      type: String,
      required: true,
    },
    subCategoryId: {
      type: String,
      required: true,
    },
    highlighted: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", ProductSchema);
