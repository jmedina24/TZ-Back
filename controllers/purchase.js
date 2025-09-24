const Purchase = require("../models/purchase");
const Product = require("../models/product");

// Crear compra
async function addPurchase(req, res) {
  try {
    const userId = req.user.id;
    const { products, paymentMethod, paymentDetails } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).send({ msg: "No se han agregado productos al carrito" });
    }

    if (!paymentMethod) {
      return res.status(400).send({ msg: `Debe especificar un método de pago.` });
    }

    const allowedMethods = ["Tarjeta de crédito", "Tarjeta de débito", "MercadoPago", "PayPal"];
    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).send({ msg: `Método de pago no válido.` });
    }

    let total = 0;
    const purchaseProducts = [];

    for (let item of products) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(400).send({ msg: `Producto no encontrado.` });
      if (product.stock < item.quantity)
        return res.status(400).send({
          msg: `Stock insuficiente de ${product.brand} ${product.model}`,
        });

      // Calcular precio con descuento
      const discount = parseFloat((product.discount_percentaje || 0).toFixed(2));
      const finalPrice = parseFloat((product.price * (1 - discount / 100)).toFixed(2));

      // Guardar detalle por producto
      purchaseProducts.push({
        productId: product._id,
        quantity: item.quantity,
        priceList: product.price,
        discount_percentaje: discount,
        price: finalPrice,
        total: parseFloat((finalPrice * item.quantity).toFixed(2)),
      });

      total += finalPrice * item.quantity;

      // Actualizar stock y vendidos
      product.stock =  product.stock - item.quantity;
      product.sold = product.sold + item.quantity;
      await product.save();
    }

    const newPurchase = new Purchase({
      userId,
      products: purchaseProducts,
      total: parseFloat(total.toFixed(2)),
      status: "Pendiente",
      paymentMethod,
      paymentDetails: paymentDetails || {},
    });

    await newPurchase.save();

    res.status(201).send({
      msg: "Compra realizada correctamente",
      purchase: newPurchase,
    });
  } catch (error) {
    res.status(500).send({
      msg: "Error al realizar la compra",
      error: error.message,
    });
  }
}

// Historial de compras por usuario
async function getHistory(req, res) {
  try {
    let purchases;

    if (req.user.role === "admin") {
      purchases = await Purchase.find()
        .populate(`userId`, `firstName firstSurname email`)
        .sort({ createdAt: -1 });
    } else {
      purchases = await Purchase.find({ userId: req.user.id }).sort({
        createdAt: -1,
      });
    }

    res.send(purchases);
  } catch (error) {
    res.status(500).send({
      msg: `Error al obtener el historial de compras`,
      error: error.message,
    });
  }
}

// Detalle de compra
async function getPurchaseById(req, res) {
  try {
    const { id } = req.params;

    const purchase = await Purchase.findById(id)
      .populate("products.productId")
      .populate("userId", "firstName firstSurname email");

    if (!purchase) {
      res.status(404).send({ msg: `Compra no encontrada.` });
    }

    if (
      purchase.userId._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .send({
          msg: `ACCESO DENEGADO - No tiene permisos suficientes para ver esta compra.`,
        });
    }

    res.send(purchase);
  } catch (error) {
    res
      .status(500)
      .send({ msg: `Error al obtener la compra`, error: error.message });
  }
}

// Actualizar estado de compra (Admin)
async function updateStatus(req, res) {
  try {
    // Valida rol de usuario
    if (req.user.role !== "admin") {
      return res.status(403).send({
        msg: `ACCESO DENEGADO. Solo los administradores pueden actualizar el estado de compras.`,
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    const purchase = await Purchase.findById(id);
    if (!purchase) return res.status(404).send({ msg: `Compra no encontrada` });

    purchase.status = status;
    await purchase.save();
    res.send({ msg: `Estado actualizado`, purchase });
  } catch (error) {
    res.status(500).send({
      msg: `Error al actualizar el estado de la compra`,
      error: error.message,
    });
  }
}

module.exports = {
  addPurchase,
  getHistory,
  getPurchaseById,
  updateStatus,
};
