const express = require("express");
const api = express.Router();

const ProductQuestionController = require("../controllers/productQuestion");
const { verifyToken } = require("../middlewares/authenticated");
const checkRole = require("../middlewares/checkRole");

api.get("/product/:id/questions", ProductQuestionController.getQuestionsByProduct);
api.post("/product/:id/questions", verifyToken, ProductQuestionController.addQuestion);

api.put(
  "/questions/:questionId/answer",
  [verifyToken, checkRole(["admin"])],
  ProductQuestionController.answerQuestion
);

module.exports = api;
