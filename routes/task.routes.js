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

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             title: Learn Redis
 *             description: caching practice
 *             priority: high
 *             tags: ["backend","redis"]
 *     responses:
 *       201:
 *         description: Task created
 */


/**
 * @swagger
 * /tasks/filter:
 *   get:
 *     summary: Filter tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Filtered tasks list
 */

/**
 * @swagger
 * /tasks/{id}/attachment:
 *   post:
 *     summary: Upload file attachment
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded
 */
