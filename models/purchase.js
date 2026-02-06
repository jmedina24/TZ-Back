const mongoose = require("mongoose");

const ShippingAddressSchema = new mongoose.Schema(
  {
    reference: { type: String, default: "" },
    street: { type: String, default: "" },
    number: { type: String, default: "" },
    city: { type: String, default: "" },
    department: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    notes: { type: String, default: "" }, // ej: "Apto 301, esquina..."
  },
  { _id: false }
);

const PurchaseSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },

        priceList: { type: Number, default: 0 },
        discount_percentaje: { type: Number, default: 0 },

        price: { type: Number, required: true }, // unit final
        total: { type: Number, default: 0 },     // price * qty

        // ✅ snapshot para UI/historial robusto
        titleSnapshot: { type: String, default: "" },
        coverSnapshot: { type: String, default: "" },
      },
    ],

    // ✅ resumen monetario (tu "total" se mantiene)
    subtotalList: { type: Number, default: 0 },     // suma priceList * qty
    discountTotal: { type: Number, default: 0 },    // subtotalList - subtotalFinal
    shipping: { type: Number, default: 0 },         // costo de envío
    total: { type: Number, required: true },        // subtotalFinal + shipping

    // ✅ dirección "congelada" al momento de comprar
    shippingAddress: { type: ShippingAddressSchema, default: null },

    status: {
      type: String,
      enum: ["Pendiente", "Confirmada", "Enviada", "Cancelada"],
      default: "Pendiente",
    },

    // ✅ opcional: estado de pago separado (si no querés, borrá este bloque)
    paymentStatus: {
      type: String,
      enum: ["Pendiente", "Pagado", "Rechazado"],
      default: "Pagado", // en tu flujo actual: cuando se crea ya queda confirmada/pagada
    },

    paymentMethod: {
      type: String,
      required: true,
      enum: ["Tarjeta de crédito", "Tarjeta de débito", "MercadoPago", "PayPal"],
    },

    paymentDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Purchase", PurchaseSchema);
