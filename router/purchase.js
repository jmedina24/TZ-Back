const express = require("express");
const md_auth = require("../middlewares/authenticated");
const checkRole = require("../middlewares/checkRole");
const PurchaseController = require("../controllers/purchase");

const api = express.Router();

api.post(
  "/purchase/add",
  [md_auth.verifyToken],
  PurchaseController.addPurchase
);
api.get(
  "/purchase/history",
  [md_auth.verifyToken],
  PurchaseController.getHistory
);
api.get(
  "/purchase/:id",
  [md_auth.verifyToken],
  PurchaseController.getPurchaseById
);

api.put(
  "/purchase/:id/status",
  [md_auth.verifyToken, checkRole(["admin"])],
  PurchaseController.updateStatus
);

module.exports = api;
