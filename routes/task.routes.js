const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  createTask,
  getTasks,
  toggleTask,
  deleteTask,
  filterTasks
} = require("../controllers/task.controller");

router.post("/", authMiddleware, createTask);
router.get("/", authMiddleware, getTasks);
router.patch("/:id/toggle", authMiddleware, toggleTask);
router.delete("/:id", authMiddleware, deleteTask);
router.get("/filter", authMiddleware, filterTasks);

module.exports = router;
