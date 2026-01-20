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
router.post("/login",rateLimiter({
    windowSeconds: 15*60,
    maxRequests: 100  ,
    keyPrefix: "rl:login"
}), login);
router.post("/refresh", refresh);
router.post("/logout", logout);

module.exports = router;
