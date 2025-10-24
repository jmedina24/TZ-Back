const express = require("express");
const ProductController = require("../controllers/product");
const {verifyToken} = require('../middlewares/authenticated');
const checkRole = require('../middlewares/checkRole');

const api = express.Router();

const multiparty = require("connect-multiparty");
const md_upload = multiparty({ uploadDir: "./uploads/products" });

api.post("/product/add", [verifyToken, checkRole(['admin']), md_upload], ProductController.addProduct);
api.get("/product/get", ProductController.getProducts);
api.put("/product/update/:id", [verifyToken, checkRole(['admin']), md_upload], ProductController.updateProduct);
api.delete("/product/delete/:id", [verifyToken, checkRole(['admin']), md_upload], ProductController.deleteProduct);

module.exports = api;
