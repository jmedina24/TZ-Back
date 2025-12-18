const jwt = require("../utils/jwt");

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ msg: "No autenticado" });
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  try {
    const payload = jwt.decode(token);

    const currentDate = Date.now();
    if (payload.exp * 1000 <= currentDate) {
      return res.status(401).send({ msg: "Token expirado" });
    }

    req.user = {
      ...payload,
      id: payload.user_id,
      role: String(payload.role || "user").toLowerCase().trim(),
    };

    return next();
  } catch (error) {
    return res.status(401).send({ msg: "Token inválido" });
  }
}

module.exports = { verifyToken };

