const jwt = require("../utils/jwt");

function verifyToken(req, res, next) {
  if (!req.headers.authorization) {
    res.status(403).send({ msg: `La petición no tiene cabecera` });
  }

  // Quitar palabra Bearer
  const token = req.headers.authorization.replace("Bearer ", "");

  try {
    const payload = jwt.decode(token);
    const { exp } = payload;
    const currentDate = new Date().getTime();

    if (exp <= currentDate) {
      return res.status(400).send({ msg: `Token expirado` });
    }

    req.user = payload;
    next();
  } catch (error) {
    return res.status(400).send({ msg: `Token inválido` });
  }

}

module.exports = {
  verifyToken,
};
