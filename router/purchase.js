const express = require("express");
const api = express.Router();
const { downloadInvoice } = require("../controllers/purchase");
const { sendInvoiceEmail } = require("../controllers/purchase");

const md_auth = require("../middlewares/authenticated");
const PurchaseController = require("../controllers/purchase");

api.post(
  "/purchase/checkout",
  [md_auth.verifyToken],
  PurchaseController.checkoutFromCart
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

api.patch(
  "/purchase/:id/status",
  [md_auth.verifyToken],
  PurchaseController.updateStatus
);

api.get("/purchase/:id/invoice", [md_auth.verifyToken], PurchaseController.downloadInvoice);
api.post("/purchase/:id/invoice/email", [md_auth.verifyToken], PurchaseController.sendInvoiceEmail);


module.exports = api;
