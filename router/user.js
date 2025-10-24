const express = require("express");
const UserController = require("../controllers/user");
const md_auth = require("../middlewares/authenticated");

const api = express.Router();

// User
api.get("/user/me", [md_auth.verifyToken], UserController.getMe);

// Address
api.post("/user/addaddress", [md_auth.verifyToken], UserController.addAddress);
api.get("/user/getaddress", [md_auth.verifyToken], UserController.getAddress);
api.put(
  "/user/updateaddress/:id",
  [md_auth.verifyToken],
  UserController.updateAddress
);
api.delete(
  "/user/deleteaddress/:id",
  [md_auth.verifyToken],
  UserController.deleteAddress
);

// Phones
api.post("/user/addphone", [md_auth.verifyToken], UserController.addPhone);
api.get("/user/getphone", [md_auth.verifyToken], UserController.getPhone);
api.put(
  "/user/updatephone/:id",
  [md_auth.verifyToken],
  UserController.updatePhone
);
api.delete(
  "/user/deletephone/:id",
  [md_auth.verifyToken],
  UserController.deletePhone
);

// Cards
api.post("/user/addcard", [md_auth.verifyToken], UserController.addCard);
api.get("/user/getcard", [md_auth.verifyToken], UserController.getCard);
api.put("/user/updatecard/:id", [md_auth.verifyToken], UserController.updateCard);
api.delete(
  "/user/deletecard/:id",
  [md_auth.verifyToken],
  UserController.deleteCard
);

// Favourites
api.post("/user/favorites", [md_auth.verifyToken], UserController.addFavourite);
api.delete(
  "/user/favorites/:productId",
  [md_auth.verifyToken],
  UserController.removeFavourite
);
api.get("/user/favorites", [md_auth.verifyToken], UserController.getFavourites);

module.exports = api;
