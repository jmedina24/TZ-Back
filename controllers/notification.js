// controllers/notification.js
const Notification = require("../models/notification");

async function listMyNotifications(req, res) {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).send({ msg: "No autorizado." });

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    // filtros opcionales (por si los querés después)
    const type = req.query.type ? String(req.query.type) : null;
    const unreadOnly = String(req.query.unread || "").toLowerCase() === "true";

    const filter = { userId };
    if (type) filter.type = type;
    if (unreadOnly) filter.readAt = null;

    const [items, totalItems] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return res.status(200).send({
      items,
      page,
      totalPages,
      totalItems,
      limit,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ msg: "Error listando notificaciones." });
  }
}

async function getUnreadCount(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).send({ msg: "No autorizado." });

    const count = await Notification.countDocuments({ userId, readAt: null });
    return res.status(200).send({ unread: count });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ msg: "Error obteniendo no leídas." });
  }
}

async function markAsRead(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).send({ msg: "No autorizado." });

    const { id } = req.params;
    if (!id) return res.status(400).send({ msg: "ID inválido." });

    const updated = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { readAt: new Date() },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).send({ msg: "Notificación no encontrada." });

    return res.status(200).send({ msg: "OK", notification: updated });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ msg: "Error marcando como leída." });
  }
}

async function markAllAsRead(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).send({ msg: "No autorizado." });

    const r = await Notification.updateMany(
      { userId, readAt: null },
      { $set: { readAt: new Date() } }
    );

    return res.status(200).send({
      msg: "OK",
      modified: r.modifiedCount ?? r.nModified ?? 0,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ msg: "Error marcando todas como leídas." });
  }
}

module.exports = {
  listMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
