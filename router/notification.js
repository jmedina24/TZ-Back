const express = require("express");
const NotificationController = require("../controllers/notification");
const { verifyToken } = require("../middlewares/authenticated");

const api = express.Router();

api.get("/notifications", [verifyToken], NotificationController.listMyNotifications);
api.get("/notifications/unread-count", [verifyToken], NotificationController.getUnreadCount);
api.put("/notifications/:id/read", [verifyToken], NotificationController.markAsRead);
api.put("/notifications/read-all", [verifyToken], NotificationController.markAllAsRead);

module.exports = api;
