function checkRole(roles = []) {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(401).send({ msg: "No autenticado" });
      }

      const role = String(req.user.role).toLowerCase().trim();

      if (!allowed.includes(role)) {
        return res.status(403).send({ msg: "ACCESO DENEGADO. No tienes permisos suficientes" });
      }

      next();
    } catch (error) {
      return res.status(500).send({ msg: "Error en la validación de roles", error: error.message });
    }
  };
}

module.exports = checkRole;

