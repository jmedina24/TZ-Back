const User = require("../models/user");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("../utils/jwt");

async function register(req, res) {
  try {
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

    // Verificar si ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .send({ msg: `Ya existe un usuario asociado a ese E-Mail.` });
    }

    // Hashear contraseña
    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(password, salt);

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Crear usuario
    const user = new User({
      email: email.toLowerCase(),
      password: hashPassword,
      firstName,
      middleName,
      firstSurname,
      secondSurname,
      birthDate,
      role: "user",
      active: false,
      verificationToken,
      creationDate: new Date(),
    });

    await user.save();

    // Configurar transporte de correo
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const verifyUrl = `${process.env.BACKEND_URL}/api/v1/auth/verify/${verificationToken}`;

    // Enviar mail
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "TechZone - Verificación de su cuenta",
      html: `<p>¡Hola ${firstName} ${firstSurname}!,</p>
      <p>Haz click en el siguiente link para activar tu cuenta:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>`,
    });

    res.status(201).send({
      msg: `Usuario registrado correctamente. Revise su correo electrónico para activar la cuenta.`,
    });
  } catch (error) {
    res
      .status(400)
      .send({ msg: `Error al crear el usuario: ${error.message}` });
  }
  res.status(400).send({ msg: `Error al crear el usuario', ${error}` });
}

async function verifyUser(req, res) {
  try {
    const { token } = req.params;

    // Buscar al usuario por token
    const user = await User.findOne({ verificationToken: token });
    if (!user)
      return res
        .status(400)
        .send({ msg: `Token inválido o usuario no encontrado.` });

    // Activar usuario
    user.active = true;
    user.verificationToken = undefined;
    await user.save();

    res.send({
      msg: `Usuario verificado correctamente. Ya puedes iniciar sesión en el sitio.`,
    });
  } catch (error) {
    res
      .status(500)
      .send({ msg: `Error al verificar el usuario: `, error: error.message });
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

async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email) return res.status(400).send({ msg: `E-Mail obligatorio` });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).send({ msg: `Usuario no encontrado.` });

    // Generar Token
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    // Configurar E-Mail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `${process.env.BACKEND_URL}/api/v1/auth/reset-password/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "TechZone - Reestablecer contraseña",
      html: `<p>Haz click en el siguiente enlace para reestablecer tu contraseña:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>** El enlace anterior es válido durante una hora. **</p>`,
    });

    res.send({
      msg: `Verifique su cuenta de E-Mail para reestablecer su contraseña.`,
    });
  } catch (error) {
    res
      .status(500)
      .send({
        msg: `Error al enviar el E-Mail para reestablecer la contraseña`,
        error: error.message,
      });
  }
}

async function resetPassword(req, res) {
  const { token } = req.params;
  const { password } = req.body;

  if (!password)
    return res.status(400).send({ msg: `Campo contraseña obligatorio.` });

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).send({ msg: `Token inválido o expirado` });

    // Actualizar clave
    const salt = bcrypt.genSaltSync(10);
    user.password = bcrypt.hashSync(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).send({ msg: `Contraseña actualizada correctamente.` });
  } catch (error) {
    res
      .status(500)
      .send({ msg: `Error al cambiar la contraseña.`, error: error.messsage });
  }
}

module.exports = {
  register,
  verifyUser,
  login,
  forgotPassword,
  resetPassword,
};
