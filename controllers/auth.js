const User = require("../models/user");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("../utils/jwt");
const { isValidPassword, passwordErrorMsg } = require("../utils/passwordRules");

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

    // ✅ validar password fuerte
    if (!isValidPassword(password)) {
      return res.status(400).send({ msg: passwordErrorMsg() });
    }

    const emailLower = email.toLowerCase();

    // Verificar si ya existe
    const existingUser = await User.findOne({ email: emailLower });
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
      email: emailLower,
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

    const verifyUrl = `${process.env.BACKEND_URL}/user/verify/${verificationToken}`;

    // Enviar mail
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: emailLower,
      subject: "TechZone - Verificación de su cuenta",
      html: `<p>¡Hola ${firstName} ${firstSurname}!,</p>
      <p>Haz click en el siguiente link para activar tu cuenta:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>`,
    });

    return res.status(201).send({
      msg: `Usuario registrado correctamente. Revise su correo electrónico para activar la cuenta.`,
    });
  } catch (error) {
    return res
      .status(400)
      .send({ msg: `Error al crear el usuario: ${error.message}` });
  }
}

async function checkEmail(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({ msg: `E-Mail obligatorio` });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    }).select("_id");

    return res.status(200).send({ exists: !!existingUser });
  } catch (error) {
    return res.status(500).send({ msg: `Error al verificar el E-Mail` });
  }
}

async function verifyUser(req, res) {
  try {
    const { token } = req.params;

    // Buscar al usuario por token
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/?verified=0&reason=invalid`
      );
    }

    // Activar usuario
    user.active = true;
    user.verificationToken = undefined;
    await user.save();

    return res.redirect(`${process.env.FRONTEND_URL}/?verified=1`);
  } catch (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/?verified=0&reason=server`);
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  const genericError = { msg: "Usuario o contraseña incorrecto" };

  if (!email) return res.status(400).send(genericError);
  if (!password) return res.status(400).send(genericError);

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).send(genericError);
    }

    const check = await bcrypt.compare(password, user.password);

    if (!check) {
      return res.status(400).send(genericError);
    }

    if (!user.active) {
      return res.status(401).send({ msg: `Usuario inactivo` });
    }

    return res.status(200).send({ token: jwt.createAccessToken(user) });
  } catch (error) {
    return res.status(500).send({ msg: "Error en el servidor" });
  }
}

async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email) return res.status(400).send({ msg: "E-Mail obligatorio" });

  try {
    const emailLower = email.toLowerCase();

    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(404).send({ msg: "Usuario no encontrado." });

    // 1) Generar token y expiración (1 hora)
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    // 2) URL que debe abrir el usuario (FRONT)
    const frontendBase =
      process.env.FRONTEND_URL || "http://localhost:5173";

    // ✅ opcional: mandar email como query para prefill login luego
    const resetUrl = `${frontendBase}/reset-password/${token}?email=${encodeURIComponent(
      emailLower
    )}`;

    // 3) Configurar E-Mail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 4) Enviar mail apuntando al FRONT
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: emailLower,
      subject: "TechZone - Restablecer contraseña",
      html: `
        <p>Hacé click en el siguiente enlace para restablecer tu contraseña:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p><strong>El enlace es válido durante una hora.</strong></p>
      `,
    });

    return res.send({
      msg: "Verificá tu E-Mail para restablecer tu contraseña.",
    });
  } catch (error) {
    return res.status(500).send({
      msg: "Error al enviar el E-Mail para restablecer la contraseña",
      error: error.message,
    });
  }
}

async function resetPassword(req, res) {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).send({ msg: `Campo contraseña obligatorio.` });
  }

  // ✅ validar password fuerte
  if (!isValidPassword(password)) {
    return res.status(400).send({ msg: passwordErrorMsg() });
  }

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send({ msg: `Token inválido o expirado` });
    }

    // Actualizar clave
    const salt = bcrypt.genSaltSync(10);
    user.password = bcrypt.hashSync(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).send({ msg: `Contraseña actualizada correctamente.` });
  } catch (error) {
    return res.status(500).send({
      msg: `Error al cambiar la contraseña.`,
      error: error.message,
    });
  }
}

async function changePassword(req, res) {
  const userId = req.user?.id || req.user?._id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).send({ msg: "Campos obligatorios." });
  }

  // ✅ validar password fuerte
  if (!isValidPassword(newPassword)) {
    return res.status(400).send({ msg: passwordErrorMsg() });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send({ msg: "Usuario no encontrado." });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res.status(400).send({ msg: "Contraseña actual incorrecta." });
    }

    const salt = bcrypt.genSaltSync(10);
    user.password = bcrypt.hashSync(newPassword, salt);
    await user.save();

    return res.status(200).send({ msg: "Contraseña actualizada correctamente." });
  } catch (error) {
    return res.status(500).send({
      msg: "Error al cambiar la contraseña.",
      error: error.message,
    });
  }
}

module.exports = {
  register,
  verifyUser,
  login,
  checkEmail,
  forgotPassword,
  resetPassword,
  changePassword,
};
