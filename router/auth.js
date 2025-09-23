const express = require('express');
const AuthController = require('../controllers/auth');

const api = express.Router();

// Login y registro
api.post('/auth/register', AuthController.register);
api.post('/auth/login', AuthController.login);

// Verificar cuenta (vía E-Mail)
api.get('/user/verify/:token', AuthController.verifyUser);

// ¿Olvidó su contraseña?
api.post("/auth/forgot-password", AuthController.forgotPassword);
api.post("/auth/reset-password/:token", AuthController.resetPassword);


module.exports = api;