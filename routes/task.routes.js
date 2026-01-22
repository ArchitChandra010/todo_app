const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");


const {
  createTask,
  getTasks,
  toggleTask,
  deleteTask,
  filterTasks,
  redis_test,
  uploadAttachment
} = require("../controllers/task.controller");

router.post("/", authMiddleware, createTask);
router.get("/", authMiddleware, getTasks);
router.patch("/:id/toggle", authMiddleware, toggleTask);
router.delete("/:id", authMiddleware, deleteTask);
router.get("/filter", authMiddleware, filterTasks);
router.get("/redis_test", authMiddleware, redis_test);
router.post("/:id/attachments", authMiddleware, upload.single("file"),uploadAttachment)

module.exports = router;
