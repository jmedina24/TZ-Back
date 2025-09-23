const express = require("express");
const ProductController = require("../controllers/product");

const api = express.Router();

const multiparty = require("connect-multiparty");
const md_upload = multiparty({ uploadDir: "./uploads/products" });

api.post("/product/add", [md_upload], ProductController.addProduct);
api.get("/product/get", ProductController.getProducts);
api.put("/product/update/:id", [md_upload], ProductController.updateProduct);
api.delete("/product/delete/:id", ProductController.deleteProduct);

module.exports = api;
