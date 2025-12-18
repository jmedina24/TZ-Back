const express = require('express');
const AuthController = require('../controllers/auth');
const md_auth = require("../middlewares/authenticated");

const api = express.Router();

// Login y registro
api.post('/auth/register', AuthController.register);
api.post('/auth/login', AuthController.login);

// Verificar cuenta (vía E-Mail)
api.get('/user/verify/:token', AuthController.verifyUser);

// ¿Olvidó su contraseña?
api.post("/auth/forgot-password", AuthController.forgotPassword);
api.post("/auth/reset-password/:token", AuthController.resetPassword);
api.patch("/auth/change-password", [md_auth.verifyToken], AuthController.changePassword);



module.exports = api;