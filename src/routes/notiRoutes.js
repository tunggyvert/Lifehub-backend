const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require("../controllers/notiControllers");

const { authentication, authorize } = require("../middlewares/authMiddlewares");

router.get("/", authentication, getMyNotifications);

router.get("/unread-count", authentication, getUnreadNotificationCount);

router.put("/:id/read", authentication, markNotificationAsRead);

router.put("/read-all", authentication, markAllNotificationsAsRead);

module.exports = router;