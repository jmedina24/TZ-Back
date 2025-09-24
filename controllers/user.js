const User = require("../models/user");
const mongoose = require("mongoose");

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

module.exports = {
  getMe,
  addAddress,
  getAddress,
  addPhone,
  getPhone,
  addCard,
  getCard,
  addFavourite,
  removeFavourite,
  getFavourites,
};
