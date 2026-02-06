// utils/passwordRules.js
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=.,])[A-Za-z\d!@#$%^&*()_\-+=.,]{10,}$/;

function isValidPassword(password) {
  return PASSWORD_REGEX.test(String(password || ""));
}

function passwordErrorMsg() {
  return "La contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula, un número y un carácter especial (!@#$%^&*()_-+=.,).";
}

module.exports = {
  PASSWORD_REGEX,
  isValidPassword,
  passwordErrorMsg,
};
