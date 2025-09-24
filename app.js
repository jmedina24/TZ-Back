const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const apiVersion = process.env.API_VERSION;

const app = express();

// Configuración Heder HTTP - CORS
app.use(cors());

// Configuración de Body Parse
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Importación de rutas
const authRoutes = require('./router/auth');
const userRoutes = require('./router/user');
const categories = require('./router/category');
const productRoutes = require('./router/product');
const purchaseRoutes = require('./router/purchase');

// Configuración de rutas
app.use(`/api/${apiVersion}`, authRoutes);
app.use(`/api/${apiVersion}`, userRoutes);
app.use(`/api/${apiVersion}/categories`, categories);
app.use(`/api/${apiVersion}`, productRoutes);
app.use(`/api/${apiVersion}`, purchaseRoutes);


// Configuración de Static Folder
app.use(express.static('uploads'));

module.exports = app;