const express = require('express');
const UserController = require('../controllers/user');
const md_auth = require('../middlewares/authenticated');

const api = express.Router();

api.get('/user/me', md_auth.verifyToken, UserController.getMe);
api.post('/user/addaddress', md_auth.verifyToken, UserController.addAddress);
api.get('/user/getaddress', md_auth.verifyToken, UserController.getAddress);
api.post('/user/addphone', md_auth.verifyToken, UserController.addPhone);
api.get('/user/getphone', md_auth.verifyToken, UserController.getPhone);
api.post('/user/addcard', md_auth.verifyToken, UserController.addCard);
api.get('/user/getcard', md_auth.verifyToken, UserController.getCard);

module.exports = api;