const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload'); // 👈 importar
require('dotenv').config();
const apiVersion = process.env.API_VERSION;

const app = express();

// Configuración Heder HTTP - CORS
app.use(cors());

// Configuración de Body Parse
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 🔹 Middleware para manejar archivos (req.files)
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: './uploads/tmp', // o la carpeta temporal que quieras
  })
);

// Importación de rutas
const authRoutes = require('./router/auth');
const userRoutes = require('./router/user');
const categories = require('./router/category');
const productRoutes = require('./router/product');
const purchaseRoutes = require('./router/purchase');
const productQuestionRoutes = require('./router/productQuestion');
const notificationRoutes = require('./router/notification');

// Configuración de rutas
app.use(`/api/${apiVersion}`, authRoutes);
app.use(`/api/${apiVersion}`, userRoutes);
app.use(`/api/${apiVersion}/categories`, categories);
app.use(`/api/${apiVersion}`, productRoutes);
app.use(`/api/${apiVersion}`, purchaseRoutes);
app.use(`/api/${apiVersion}`, productQuestionRoutes);
app.use(`/api/${apiVersion}`, notificationRoutes);

// Configuración de Static Folder
app.use(express.static('uploads')); // esto sirve lo que haya dentro de /uploads en la raíz

module.exports = app;
