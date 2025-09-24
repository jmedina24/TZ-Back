function checkRole(roles = []) {
  return (req, res, next) => {
    try {
      if (!roles.includes(req.user.role)) {
        return res
          .status(403)
          .send({ msg: `ACCESO DENEGADO. No tienes permisos suficientes` });
      }
      next();
    } catch (error) {
      return res
        .status(500)
        .send({ msg: `Error en la validación de roles`, error: error.message });
    }
  };
}

module.exports = checkRole;
