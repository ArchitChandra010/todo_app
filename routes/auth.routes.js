const express = require("express");
const router = express.Router();
const rateLimiter = require("../middlewares/rateLimit.middleware")

const { 
    register,
    login,
    refresh,
    logout
} = require("../controllers/auth.controller");



router.post("/register",rateLimiter({
    windowSeconds: 15*60,
    maxRequests: 5,
    keyPrefix: "rl:register",
    allowlistIPs: ["127.0.0.1"]
}), register);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: Archit
 *             email: archit@mail.com
 *             password: 123456
 *       application/xml:
 *           example:
 *             name: Archit
 *             email: archit@mail.com
 *             password: 123456
 *     responses:
 *       201:
 *         description: User created
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             email: archit@mail.com
 *             password: 123456
 *     responses:
 *       200:
 *         description: JWT token returned
 */


router.post("/login",rateLimiter({
    windowSeconds: 15*60,
    maxRequests: 100  ,
    keyPrefix: "rl:login"
}), login);
router.post("/refresh", refresh);
router.post("/logout", logout);

module.exports = router;
