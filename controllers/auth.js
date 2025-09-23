const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require('../utils/jwt');

async function register(req, res) {
  const {
    email,
    password,
    firstName,
    middleName,
    firstSurname,
    secondSurname,
    birthDate,
  } = req.body;
  const errors = [];

  if (!email) errors.push("E-Mail obligatorio");
  if (!password) errors.push("Contraseña obligatoria");
  if (!firstName) errors.push("Primer Nombre obligatorio");
  if (!firstSurname) errors.push("Primer Apellido obligatorio");
  if (!secondSurname) errors.push("Segundo Apellido obligatorio");
  if (!birthDate) errors.push("Fecha de Nacimiento obligatoria");

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const user = new User({
    email: email.toLowerCase(),
    password: password,
    firstName: firstName,
    middleName: middleName,
    firstSurname: firstSurname,
    secondSurname: secondSurname,
    birthDate: birthDate,
    role: "user",
    active: false,
    creationDate: new Date(),
  });

  const salt = bcrypt.genSaltSync(10);
  const hashPassword = bcrypt.hashSync(password, salt);
  user.password = hashPassword;

  try {
    await user.save();
    res.status(200).send({ msg: "Usuario creado" });
  } catch (error) {
    res.status(400).send({ msg: `Error al crear el usuario', ${error}` });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email) return res.status(400).send({ msg: "Campo E-Mail obligatorio" });
  if (!password)
    return res.status(400).send({ msg: "Campo Contraseña obligatorio" });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    const check = await bcrypt.compare(password, user.password);

    if (!check) {
      res.status(400).send({ msg: `Contraseña incorrecta` });
    } else if (!user.active) {
      res.status(401).send({ msg: `Usuario inactivo` });
    } else {
      res.status(200).send({ token: jwt.createAccessToken(user) });
    }
  } catch (error) {
    res.status(500).send({ msg: "Error en el servidor" });
  }
}


module.exports = {
  register,
  login,
};
