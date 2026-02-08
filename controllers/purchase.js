// controllers/purchase.js
const nodemailer = require("nodemailer");
const Purchase = require("../models/purchase");
const Product = require("../models/product");
const User = require("../models/user");
const { buildInvoicePdfBuffer } = require("../utils/invoicePdf");
const path = require("path");
const Notification = require("../models/notification");


// =======================
// Helpers
// =======================
const calcDiscountedPrice = (price, discount) => {
  const p = Number(price) || 0;
  const d = Number(discount) || 0;
  if (!d || d <= 0) return p;
  return Math.round(p - p * (d / 100));
};

const canSendEmail = () => {
  return !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS;
};

const createTransporter = () => {
  if (!canSendEmail()) {
    throw new Error("EMAIL_USER/EMAIL_PASS no configurados en .env");
  }

  // ✅ Gmail (App Password)
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ✅ helper: logo path único (así lo usás en todos lados)
const getLogoPath = () => {
  // ./controllers -> ../assets/techzone-logo.png
  return path.join(__dirname, "../assets/techzone-logo.png");
};

// =======================
// ✅ Checkout desde carrito + envío automático factura
// POST /purchase/checkout
// body: { shippingAddress, paymentMethod, paymentDetails?, cardId? }
// =======================
async function checkoutFromCart(req, res) {
  try {
    const userId = req.user.id;
    const { shippingAddress, paymentMethod, paymentDetails = {}, cardId } = req.body;

    // 0) Validaciones
    if (!shippingAddress?.street || !shippingAddress?.city) {
      return res.status(400).send({ msg: "Dirección inválida." });
    }

    const allowedMethods = ["Tarjeta de crédito", "Tarjeta de débito", "MercadoPago", "PayPal"];
    if (!paymentMethod || !allowedMethods.includes(paymentMethod)) {
      return res.status(400).send({ msg: "Método de pago no válido." });
    }

    // 1) Usuario + carrito
    const user = await User.findById(userId);
    if (!user) return res.status(404).send({ msg: "Usuario no encontrado." });

    const cart = Array.isArray(user.cart) ? user.cart : [];
    if (!cart.length) return res.status(400).send({ msg: "El carrito está vacío." });

    // 2) Validar tarjeta si aplica
    let finalPaymentDetails = { ...paymentDetails };

    if (paymentMethod.startsWith("Tarjeta")) {
      if (!cardId) {
        return res.status(400).send({ msg: "cardId es requerido para pago con tarjeta." });
      }

      const card = (user.cards || []).find((c) => String(c._id) === String(cardId));
      if (!card) return res.status(404).send({ msg: "Tarjeta no encontrada." });

      finalPaymentDetails = {
        ...finalPaymentDetails,
        cardId: String(card._id),
        type: card.type,
        bank: card.bank || "",
        last4: String(card.cardNumber || "").slice(-4),
      };
    }

    // 3) Traer productos (1 query)
    const ids = cart.map((i) => i.productId);
    const productsDb = await Product.find({ _id: { $in: ids } });
    const map = new Map(productsDb.map((p) => [String(p._id), p]));

    // 4) Armar compra + totales
    let subtotalList = 0;
    let subtotalFinal = 0;
    const purchaseProducts = [];

    for (const item of cart) {
      const pid = String(item.productId);
      const qty = Math.max(1, Number(item.qty) || 1);

      const product = map.get(pid);
      if (!product) {
        return res.status(400).send({ msg: "Producto no encontrado en el carrito." });
      }

      // ✅ validar stock (opcional pero recomendado)
      if (typeof product.stock === "number" && product.stock < qty) {
        return res.status(400).send({
          msg: `Stock insuficiente de ${product.brand} ${product.model}`,
        });
      }

      const priceList = Number(product.price) || 0;
      const discount = Number(product.discount_percentaje) || 0;
      const finalPrice = calcDiscountedPrice(priceList, discount);

      const lineList = priceList * qty;
      const lineFinal = finalPrice * qty;

      subtotalList += lineList;
      subtotalFinal += lineFinal;

      purchaseProducts.push({
        productId: product._id,
        quantity: qty,
        priceList,
        discount_percentaje: discount,
        price: finalPrice,
        total: lineFinal,

        // snapshots
        titleSnapshot: `${product.brand} ${product.model}`.trim(),
        coverSnapshot: product.cover || "",
      });
    }

    const discountTotal = Math.max(0, subtotalList - subtotalFinal);
    const shipping = 0;
    const finalTotal = subtotalFinal + shipping;

    // 5) Crear compra
    const newPurchase = await Purchase.create({
      userId,
      products: purchaseProducts,
      subtotalList,
      discountTotal,
      shipping,
      total: finalTotal,
      shippingAddress,
      status: "Confirmada",
      paymentMethod,
      paymentDetails: finalPaymentDetails,
    });

    // ✅ 5.1) Notificación: compra creada
    await Notification.create({
      userId, // el que comprórs
      type: "purchase_created",
      title: "Compra confirmada",
      message: `Tu compra #${String(newPurchase._id).slice(-8).toUpperCase()} fue confirmada.`,
      meta: {
        purchaseId: newPurchase._id,
        status: "Confirmada",
      },
    });

    // 6) Descontar stock + sold (seguro)
    for (const it of purchaseProducts) {
      const r = await Product.updateOne(
        { _id: it.productId, stock: { $gte: it.quantity } },
        { $inc: { stock: -it.quantity, sold: it.quantity } }
      );

      if (r.modifiedCount === 0) {
        return res.status(400).send({
          msg: "Stock insuficiente (cambió mientras comprabas). Actualizá el carrito.",
        });
      }
    }

    // 7) Vaciar carrito
    user.cart = [];
    await user.save();

    // 8) ✅ Enviar factura automáticamente (NO rompe checkout si falla)
    // 8) ✅ Enviar factura automáticamente (NO rompe checkout si falla)
    let invoiceEmailSent = false;
    let invoiceEmailError = null;

    if (canSendEmail()) {
      try {
        const purchaseFull = await Purchase.findById(newPurchase._id)
          .populate("products.productId")
          .populate("userId", "firstName firstSurname email");

        const to = purchaseFull?.userId?.email;

        if (!to) {
          invoiceEmailError = "El usuario no tiene email registrado.";
        } else {
          const transporter = createTransporter();

          // ✅ esto ayuda muchísimo a detectar config rota
          await transporter.verify();

          // ✅ logo en el PDF del email también (igual que descarga)
          const logoPath = path.join(__dirname, "../assets/techzone-logo.png");
          const pdfBuffer = await buildInvoicePdfBuffer(purchaseFull, { logoPath });

          const orderShort = String(purchaseFull._id).slice(-8).toUpperCase();

          await transporter.sendMail({
            from: `TechZone <${process.env.EMAIL_USER}>`,
            to,
            subject: `TechZone - Factura ${orderShort}`,
            text: `Adjuntamos la factura de tu compra (${orderShort}). ¡Gracias por comprar en TechZone!`,
            attachments: [
              {
                filename: `factura-${orderShort}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ],
          });

          invoiceEmailSent = true;
        }
      } catch (e) {
        invoiceEmailSent = false;
        invoiceEmailError = e?.message || String(e);

        // ✅ IMPORTANTE: log real, porque si no, nunca sabés por qué falla
        console.error("⚠️ Error enviando factura por email:", e);
      }
    } else {
      invoiceEmailError = "EMAIL_USER/EMAIL_PASS no configurados.";
    }


    return res.status(201).send({
      msg: "Compra realizada correctamente",
      purchaseId: newPurchase._id,
      invoiceEmailSent,
      invoiceEmailError, // 👈 para debug
    });

  } catch (error) {
    return res.status(500).send({
      msg: "Error al realizar la compra",
      error: error.message,
    });
  }
}

// =======================
// Historial de compras
// GET /purchase/history
// =======================
async function getHistory(req, res) {
  try {
    let purchases;

    if (req.user.role === "admin") {
      purchases = await Purchase.find()
        .populate("userId", "firstName firstSurname email")
        .sort({ createdAt: -1 });
    } else {
      purchases = await Purchase.find({ userId: req.user.id }).sort({ createdAt: -1 });
    }

    return res.status(200).send({ purchases });
  } catch (error) {
    return res.status(500).send({
      msg: "Error al obtener el historial de compras",
      error: error.message,
    });
  }
}

// =======================
// Detalle de compra
// GET /purchase/:id
// =======================
async function getPurchaseById(req, res) {
  try {
    if (!req.user) return res.status(401).send({ msg: "No autorizado." });

    const { id } = req.params;

    const purchase = await Purchase.findById(id)
      .populate("products.productId")
      .populate("userId", "firstName firstSurname email");

    if (!purchase) return res.status(404).send({ msg: "Compra no encontrada." });

    const isOwner = purchase.userId?._id?.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).send({ msg: "Sin permisos." });
    }

    return res.status(200).send({ purchase });
  } catch (error) {
    return res.status(500).send({ msg: "Error al obtener la compra", error: error.message });
  }
}

// =======================
// Actualizar estado (Admin)
// PATCH /purchase/:id/status
// =======================
async function updateStatus(req, res) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).send({ msg: "ACCESO DENEGADO. Solo admin." });
    }

    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["Pendiente", "Confirmada", "Enviada", "Cancelada"];
    if (!allowed.includes(status)) {
      return res.status(400).send({ msg: "Estado no válido." });
    }

    const purchase = await Purchase.findById(id);
    if (!purchase) return res.status(404).send({ msg: "Compra no encontrada." });

    const prevStatus = purchase.status;
    purchase.status = status;
    await purchase.save();

    // ✅ notificación solo si cambió
    if (String(prevStatus || "") !== String(status || "")) {
      try {
        const ownerId = purchase.userId?._id || purchase.userId;
        if (ownerId) {
          await Notification.create({
            userId: ownerId,
            type: "purchase_status_changed",
            title: "Actualización de tu compra",
            message: `Tu compra #${String(purchase._id).slice(-8).toUpperCase()} pasó a estado: ${status}.`,
            meta: { purchaseId: purchase._id, status },
          });
        }
      } catch (e) {
        console.error("⚠️ Error creando notificación purchase_status_changed:", e?.message || e);
      }
    }

    return res.status(200).send({ msg: "Estado actualizado", purchase });
  } catch (error) {
    return res.status(500).send({ msg: "Error al actualizar", error: error.message });
  }
}



// =======================
// Descargar factura PDF
// GET /purchase/:id/invoice
// =======================
async function downloadInvoice(req, res) {
  try {
    const { id } = req.params;

    const purchase = await Purchase.findById(id)
      .populate("products.productId")
      .populate("userId", "firstName firstSurname email");

    if (!purchase) return res.status(404).send({ msg: "Compra no encontrada." });

    const isOwner = purchase.userId?._id?.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).send({ msg: "Sin permisos." });

    const logoPath = getLogoPath();

    const pdfBuffer = await buildInvoicePdfBuffer(purchase, { logoPath });

    res.setHeader("Content-Type", "application/pdf");
    // si preferís descargar en vez de inline, cambiá a attachment
    res.setHeader("Content-Disposition", `inline; filename=factura-${id}.pdf`);

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("❌ Error generando factura:", error?.message || error);
    return res.status(500).send({ msg: "Error generando factura", error: error.message });
  }
}

// =======================
// Reenviar factura por email (manual)
// POST /purchase/:id/invoice/email
// =======================
async function sendInvoiceEmail(req, res) {
  try {
    const { id } = req.params;

    const purchase = await Purchase.findById(id)
      .populate("products.productId")
      .populate("userId", "firstName firstSurname email");

    if (!purchase) return res.status(404).send({ msg: "Compra no encontrada." });

    const isOwner = purchase.userId?._id?.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).send({ msg: "Sin permisos." });

    const to = purchase.userId?.email;
    if (!to) return res.status(400).send({ msg: "El usuario no tiene email registrado." });

    if (!canSendEmail()) {
      return res.status(400).send({ msg: "EMAIL_USER/EMAIL_PASS no configurados." });
    }

    const logoPath = getLogoPath();
    const pdfBuffer = await buildInvoicePdfBuffer(purchase, { logoPath });

    const transporter = createTransporter();
    const orderShort = String(purchase._id).slice(-8).toUpperCase();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: `TechZone - Factura ${orderShort}`,
      text: `Adjuntamos la factura de tu compra (${orderShort}). ¡Gracias por comprar en TechZone!`,
      attachments: [
        {
          filename: `factura-${orderShort}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return res.status(200).send({ msg: `✅ Factura enviada a ${to}` });
  } catch (error) {
    console.error("❌ Error enviando factura:", error?.message || error);
    return res.status(500).send({ msg: "Error enviando factura", error: error.message });
  }
}

module.exports = {
  checkoutFromCart,
  getHistory,
  getPurchaseById,
  updateStatus,
  downloadInvoice,
  sendInvoiceEmail,
};
