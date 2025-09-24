const mongoose = require("mongoose");

const PurchaseSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        priceList: {
          type: Number,
        },
        discount_percentaje: {
          type: Number,
          default: 0,
        },
        price: {
          type: Number,
          required: true,
        },
        total: {
          type: Number,
        },
      },
    ],
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pendiente", "Confirmada", "Enviada", "Cancelada"],
      default: "Pendiente",
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: [
        "Tarjeta de crédito",
        "Tarjeta de débito",
        "MercadoPago",
        "PayPal",
      ],
    },
    paymentDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Purchase", PurchaseSchema);
