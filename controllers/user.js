const User = require("../models/user");
const image = require("../utils/image");
const mongoose = require("mongoose");
const Product = require("../models/product");

// Helpers
function toObjectId(id) {
  return new mongoose.Types.ObjectId(id);
}

function normalizeQty(qty) {
  const n = Number(qty || 1);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}


async function getMe(req, res) {
  const { user_id } = req.user;

  const user = await User.findById(user_id);

  if (!user) {
    res.status(400).send({ msg: "Usuario no registrado..." });
  } else {
    res.status(200).send(user);
  }
}

async function addAddress(req, res) {
  try {
    const { user_id } = req.user;
    const { street, number, city, department, postalCode } = req.body;

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).send({ msg: `Usuario no encontrado...` });
    }

    user.addresses.push({ street, number, city, department, postalCode });
    await user.save();

    return res.status(200).send({
      msg: `Dirección agregada correctamente`,
      addresses: user.addresses,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ msg: `Error al agregar la dirección...`, error: error.message });
  }
}

async function getAddress(req, res) {
  try {
    const { user_id } = req.user;

    const user = await User.findById(user_id).select("addresses");
    if (!user) {
      return res.status(404).send({ msg: `Usuario no encontrado` });
    }

    return res
      .status(200)
      .send({ msg: `Direcciones obtenidas`, addresses: user.addresses });
  } catch (error) {
    return res
      .status(500)
      .send({ msg: `Error al obtener las direccines`, error: error.message });
  }
}

async function updateAddress(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(400).send({ msg: `Usuario no encontrado` });

    const address = user.addresses.id(id);
    if (!address)
      return res.status(404).send({ msg: `Dirección no encontrada` });

    Object.assign(address, updateData);

    await user.save();

    return res.status(200).send({
      msg: `Dirección actualizada correctamente`,
      address,
      addresses: user.addresses,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ msg: `Error al actualizar la dirección`, error: error.message });
  }
}

async function deleteAddress(req, res) {
  try {
    const addressId = req.params.id;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).send({ msg: `Usuario no encontrado` });

    const initialLength = user.addresses.length;
    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== addressId
    );

    if (user.addresses.length === initialLength) {
      return res.status(404).send({ msg: `Dirección no encontrada.` });
    }

    await user.save();

    return res.status(200).send({
      msg: `Dirección eliminada correctamente`,
      addresses: user.addresses,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ msg: `Error al eliminar la dirección`, error: error.message });
  }
}

async function addPhone(req, res) {
  try {
    const { user_id } = req.user;
    const { type, number } = req.body;

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).send({ msg: `Usuario no encontrado` });
    }

    user.phones.push({ type, number });
    await user.save();

    return res
      .status(200)
      .send({ msg: `Teléfono agregado`, phones: user.phones });
  } catch (error) {
    return res
      .status(500)
      .send({ msg: `Error al agregar teléfono`, error: error.message });
  }
}

async function getPhone(req, res) {
  try {
    const { user_id } = req.user;

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).send({ msg: `Usuario no encontrado` });
    }

    return res
      .status(200)
      .send({ msg: `Teléfonos obtenidos: `, phones: user.phones });
  } catch (error) {
    return res
      .status(500)
      .send({ msg: `Error al obtener los teléfonos`, error: error.message });
  }
}

async function updatePhone(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(400).send({ msg: `Usuario no encontrado` });

    const phone = user.phones.id(id);
    if (!phone) return res.status(404).send({ msg: `Teléfono no encontrado` });

    Object.assign(phone, updateData);

    await user.save();

    return res.status(200).send({
      msg: `Teléfono actualizado correctamente`,
      phone,
      phones: user.phones,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ msg: `Error al actualizar el teléfono`, error: error.message });
  }
}

async function deletePhone(req, res) {
  try {
    const phoneId = req.params.id;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).send({ msg: `Usuario no encontrado` });

    const initialLength = user.phones.length;
    user.phones = user.phones.filter(
      (phone) => phone._id.toString() !== phoneId
    );

    if (user.phones.length === initialLength) {
      return res.status(404).send({ msg: `Teléfono no encontrado.` });
    }

    await user.save();

    return res.status(200).send({
      msg: `Teléfono eliminado correctamente`,
      phones: user.phones,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ msg: `Error al eliminar el teléfono`, error: error.message });
  }
}

async function addCard(req, res) {
  try {
    const { user_id } = req.user;
    const {
      cardNumber,
      cardHolder,
      expirationMonth,
      expirationYear,
      securityCode,
      type,
      bank,
    } = req.body;

    if (
      !cardNumber ||
      !cardHolder ||
      !expirationMonth ||
      !expirationYear ||
      !securityCode
    ) {
      return res
        .status(400)
        .send({ msg: `Todos los campos deben de completarse...` });
    }

    const user = await User.findById(user_id);
    if (!user) return res.status(404).send({ msg: `Usuario no encontrado` });

    user.cards.push({
      cardNumber,
      cardHolder,
      expirationMonth,
      expirationYear,
      securityCode,
      type,
      bank,
    });
    await user.save();

    return res
      .status(200)
      .send({ msg: `Tarjeta agregada correctamente`, cards: user.cards });
  } catch (error) {
    return res
      .status(500)
      .send({ msg: `Error al agregar tarjeta`, error: error.message });
  }
}

async function getCard(req, res) {
  try {
    const { user_id } = req.user;

    const user = await User.findById(user_id).select("cards");
    if (!user) return res.status(404).send({ msg: `Usuario no encontrado` });

    return res
      .status(200)
      .send({ msg: `Tarjetas obtenidas correctamente`, cards: user.cards });
  } catch (error) {
    return res
      .status(500)
      .send({ msg: `Error al obtener tarjetas`, error: error.message });
  }
}

async function updateCard(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(400).send({ msg: `Usuario no encontrado` });

    const card = user.cards.id(id);
    if (!card) return res.status(404).send({ msg: `Tarjeta no encontrada` });

    Object.assign(card, updateData);

    await user.save();

    return res.status(200).send({
      msg: `Tarjeta actualizada correctamente`,
      card,
      cards: user.cards,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ msg: `Error al actualizar la tarjeta`, error: error.message });
  }
}

async function deleteCard(req, res) {
  try {
    const cardId = req.params.id;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).send({ msg: `Usuario no encontrado` });

    const initialLength = user.cards.length;
    user.cards = user.cards.filter((card) => card._id.toString() !== cardId);

    if (user.cards.length === initialLength) {
      return res.status(404).send({ msg: `Tarjeta no encontrada.` });
    }

    await user.save();

    return res.status(200).send({
      msg: `Tarjeta eliminada correctamente`,
      cards: user.cards,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ msg: `Error al eliminar la tarjeta`, error: error.message });
  }
}

async function addFavourite(req, res) {
  try {
    const { productId } = req.body;
    const { user_id } = req.user;
    const user = await User.findById(user_id);

    if (!user) return res.status(404).send({ msg: `Usuario no encontrado.` });

    const productObjectId = new mongoose.Types.ObjectId(productId);

    if (
      user.favorites.some(
        (fav) =>
          fav.productId &&
          fav.productId.toString() === productObjectId.toString()
      )
    ) {
      return res
        .status(400)
        .send({ msg: `El producto ya se encuentra en favoritos.` });
    }

    user.favorites.push({ productId: productObjectId });
    await user.save();

    res.status(200).send({
      msg: `Producto agregado a favoritos.`,
      favorites: user.favorites,
    });
  } catch (error) {
    res.status(500).send({
      msg: `Error al intentar agregar el producto a favoritos.`,
      error: error.message,
    });
  }
}

async function removeFavourite(req, res) {
  try {
    const { productId } = req.params;
    const { user_id } = req.user;

    // Buscar al usuario
    const user = await User.findById(user_id);
    if (!user) return res.status(404).send({ msg: "Usuario no encontrado" });

    // Convertir productId de string a ObjectId para comparación
    const productObjectId = new mongoose.Types.ObjectId(productId);

    // Verificar si el producto está en los favoritos
    const favouriteIndex = user.favorites.findIndex(
      (fav) =>
        fav.productId && fav.productId.toString() === productObjectId.toString()
    );

    if (favouriteIndex === -1) {
      return res.status(404).send({ msg: "El producto no está en favoritos" });
    }

    // Eliminar el producto de favoritos
    user.favorites.splice(favouriteIndex, 1);
    await user.save();

    // Responder con los favoritos actualizados
    res.status(200).send({
      msg: "Producto eliminado de favoritos.",
      favorites: user.favorites,
    });
  } catch (error) {
    res.status(500).send({
      msg: `Error al intentar eliminar el producto de favoritos.`,
      error: error.message,
    });
  }
}

async function getFavourites(req, res) {
  try {
    const { user_id } = req.user;

    const user = await User.findById(user_id).populate("favorites.productId");

    if (!user) {
      return res.status(404).send({ msg: "Usuario no encontrado" });
    }

    const sortedFavourites = (user.favorites || []).sort(
      (a, b) => b.addedOn - a.addedOn
    );

    if (sortedFavourites.length === 0) {
      return res
        .status(200)
        .send({ msg: "No tienes productos favoritos aún." });
    }

    res.status(200).send({ favorites: sortedFavourites });
  } catch (error) {
    res
      .status(500)
      .send({ msg: `Error obteniendo favoritos`, error: error.message });
  }
}

async function uploadAvatar(req, res) {
  console.log("BODY:", req.body);
  console.log("FILES:", req.files);

  const { user_id } = req.user;

  if (!req.files || !req.files.avatar) {
    return res.status(400).send({ msg: "No se ha enviado ninguna imagen" });
  }

  try {
    const user = await User.findById(user_id);

    if (!user) {
      return res.status(400).send({ msg: "Usuario no encontrado" });
    }

    const file = req.files.avatar;
    const avatarPath = image.getFileName(file);

    user.avatar = avatarPath;
    await user.save();

    return res.status(200).send({
      msg: "Avatar actualizado correctamente",
      avatar: user.avatar,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Error al actualizar avatar" });
  }
}

async function updatePersonalInformation(req, res) {
  const { user_id } = req.user; // viene del token, igual que en getMe

  if (!user_id) {
    return res.status(401).send({ msg: "Usuario no autenticado" });
  }

  // Campos que permitimos editar desde el perfil
  const { firstName, middleName, firstSurname, secondSurname, birthDate } =
    req.body;

  const updateData = {};

  if (typeof firstName !== "undefined") updateData.firstName = firstName;
  if (typeof middleName !== "undefined") updateData.middleName = middleName;
  if (typeof firstSurname !== "undefined")
    updateData.firstSurname = firstSurname;
  if (typeof secondSurname !== "undefined")
    updateData.secondSurname = secondSurname;

  if (typeof birthDate !== "undefined") {
    // Si viene vacío, la dejamos en null
    updateData.birthDate = birthDate ? new Date(birthDate) : null;
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(user_id, updateData, {
      new: true, // devuelve el user ya actualizado
      runValidators: true, // aplica validaciones del schema
    });

    if (!updatedUser) {
      return res.status(404).send({ msg: "Usuario no encontrado" });
    }

    // Devolvemos el usuario actualizado
    res.status(200).send(updatedUser);
  } catch (error) {
    console.error("Error actualizando usuario", error);
    res.status(500).send({ msg: "Error al actualizar el usuario" });
  }
}

/**
 * GET /user/cart
 * Devuelve el carrito del usuario (con productos populados)
 */
async function getCart(req, res) {
  try {
    const { user_id } = req.user;

    const user = await User.findById(user_id).populate("cart.productId");
    if (!user) return res.status(404).send({ msg: "Usuario no encontrado" });

    // opcional: filtrar productos que ya no existan
    const cart = (user.cart || []).filter((it) => it.productId);

    return res.status(200).send({ cart });
  } catch (error) {
    return res.status(500).send({
      msg: "Error obteniendo carrito",
      error: error.message,
    });
  }
}

/**
 * POST /user/cart
 * body: { productId, qty }
 * Suma qty si el producto ya existe
 */
async function addToCart(req, res) {
  try {
    const { user_id } = req.user;
    const { productId, qty } = req.body;

    if (!productId) return res.status(400).send({ msg: "productId es requerido" });

    const q = normalizeQty(qty);
    const pid = toObjectId(productId);

    const user = await User.findById(user_id);
    if (!user) return res.status(404).send({ msg: "Usuario no encontrado" });

    const product = await Product.findById(pid);
    if (!product || product.active === false) {
      return res.status(404).send({ msg: "Producto no encontrado" });
    }

    const stock = Number(product.stock || 0);
    if (stock <= 0) return res.status(400).send({ msg: "Producto sin stock" });

    const idx = (user.cart || []).findIndex(
      (it) => it.productId && it.productId.toString() === pid.toString()
    );

    if (idx >= 0) {
      const nextQty = Math.min(stock, Number(user.cart[idx].qty || 1) + q);
      user.cart[idx].qty = nextQty;
    } else {
      user.cart.push({ productId: pid, qty: Math.min(stock, q) });
    }

    await user.save();

    const populated = await User.findById(user_id).populate("cart.productId");
    return res.status(200).send({ msg: "Carrito actualizado", cart: populated.cart });
  } catch (error) {
    return res.status(500).send({
      msg: "Error al agregar al carrito",
      error: error.message,
    });
  }
}

/**
 * PATCH /user/cart/:productId
 * body: { qty } (setea qty exacta)
 */
async function updateCartQty(req, res) {
  try {
    const { user_id } = req.user;
    const { productId } = req.params;
    const { qty } = req.body;

    if (!productId) return res.status(400).send({ msg: "productId es requerido" });

    const q = normalizeQty(qty);
    const pid = toObjectId(productId);

    const user = await User.findById(user_id);
    if (!user) return res.status(404).send({ msg: "Usuario no encontrado" });

    const product = await Product.findById(pid);
    if (!product || product.active === false) {
      return res.status(404).send({ msg: "Producto no encontrado" });
    }

    const stock = Number(product.stock || 0);
    if (stock <= 0) return res.status(400).send({ msg: "Producto sin stock" });

    const idx = (user.cart || []).findIndex(
      (it) => it.productId && it.productId.toString() === pid.toString()
    );
    if (idx === -1) return res.status(404).send({ msg: "Producto no está en el carrito" });

    user.cart[idx].qty = Math.min(stock, q);
    await user.save();

    const populated = await User.findById(user_id).populate("cart.productId");
    return res.status(200).send({ msg: "Cantidad actualizada", cart: populated.cart });
  } catch (error) {
    return res.status(500).send({
      msg: "Error al actualizar cantidad",
      error: error.message,
    });
  }
}


/**
 * DELETE /user/cart/:productId
 */
async function removeCartItem(req, res) {
  try {
    const { user_id } = req.user;
    const { productId } = req.params;

    const pid = toObjectId(productId);

    const user = await User.findById(user_id);
    if (!user) return res.status(404).send({ msg: "Usuario no encontrado" });

    const before = user.cart.length;
    user.cart = (user.cart || []).filter(
      (it) => !(it.productId && it.productId.toString() === pid.toString())
    );

    if (user.cart.length === before) {
      return res.status(404).send({ msg: "Producto no estaba en el carrito" });
    }

    await user.save();

    const populated = await User.findById(user_id).populate("cart.productId");
    return res.status(200).send({ msg: "Producto eliminado del carrito", cart: populated.cart });
  } catch (error) {
    return res.status(500).send({
      msg: "Error al eliminar del carrito",
      error: error.message,
    });
  }
}

/**
 * DELETE /user/cart
 */
async function clearCart(req, res) {
  try {
    const { user_id } = req.user;

    const user = await User.findById(user_id);
    if (!user) return res.status(404).send({ msg: "Usuario no encontrado" });

    user.cart = [];
    await user.save();

    return res.status(200).send({ msg: "Carrito vaciado", cart: [] });
  } catch (error) {
    return res.status(500).send({
      msg: "Error al vaciar carrito",
      error: error.message,
    });
  }
}

/**
 * POST /user/cart/merge
 * body: { items: [{ productId, qty }] }
 * Suma cantidades (y respeta stock actual)
 */
async function mergeCart(req, res) {
  try {
    const { user_id } = req.user;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).send({ msg: "items debe ser un array" });
    }

    const user = await User.findById(user_id);
    if (!user) return res.status(404).send({ msg: "Usuario no encontrado" });

    // Armamos mapa actual del carrito
    const map = new Map();
    for (const it of user.cart || []) {
      if (!it.productId) continue;
      map.set(it.productId.toString(), Number(it.qty || 1));
    }

    // Para respetar stock, traemos productos involucrados
    const ids = items
      .map((x) => x?.productId)
      .filter(Boolean)
      .map((id) => new mongoose.Types.ObjectId(id));

    const products = await Product.find({ _id: { $in: ids }, active: { $ne: false } });
    const stockById = new Map(products.map((p) => [p._id.toString(), Number(p.stock || 0)]));

    for (const it of items) {
      if (!it?.productId) continue;
      const pid = it.productId.toString();
      const q = normalizeQty(it.qty);

      const stock = stockById.get(pid) ?? 0;
      if (stock <= 0) continue;

      const current = map.get(pid) || 0;
      map.set(pid, Math.min(stock, current + q));
    }

    user.cart = Array.from(map.entries()).map(([pid, qty]) => ({
      productId: new mongoose.Types.ObjectId(pid),
      qty,
    }));

    await user.save();

    const populated = await User.findById(user_id).populate("cart.productId");
    return res.status(200).send({ msg: "Carrito mergeado", cart: populated.cart });
  } catch (error) {
    return res.status(500).send({
      msg: "Error al mergear carrito",
      error: error.message});
  }
}

module.exports = {
  getMe,
  addAddress,
  getAddress,
  updateAddress,
  deleteAddress,
  addPhone,
  getPhone,
  updatePhone,
  deletePhone,
  addCard,
  getCard,
  updateCard,
  deleteCard,
  addFavourite,
  removeFavourite,
  getFavourites,
  uploadAvatar,
  updatePersonalInformation,
  getCart,
  addToCart,
  updateCartQty,
  removeCartItem,
  clearCart,
  mergeCart,
};
