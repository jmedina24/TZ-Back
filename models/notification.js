const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    type: {
      type: String,
      enum: [
        "question_answered",
        "purchase_created",
        "purchase_status_changed",
      ],
      required: true,
      index: true,
    },

    title: { type: String, required: true, trim: true, maxlength: 140 },
    message: { type: String, required: true, trim: true, maxlength: 600 },

    // Para navegar al recurso relacionado
    meta: {
      purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase", default: null },
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductQuestion", default: null },
      status: { type: String, default: "" }, 
    },

    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, readAt: -1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);
