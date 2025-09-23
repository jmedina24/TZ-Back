const User = require("../models/user");

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

    if (!cardNumber || !cardHolder || !expirationMonth || !expirationYear || !securityCode) {
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
    try{
        const {user_id} = req.user;

        const user = await User.findById(user_id).select('cards');
        if(!user) return res.status(404).send({msg: `Usuario no encontrado`});

        return res.status(200).send({msg: `Tarjetas obtenidas correctamente`, cards: user.cards});
    }catch(error){
        return res.status(500).send({msg: `Error al obtener tarjetas`, error: error.message});
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
};
