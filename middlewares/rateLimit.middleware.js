const redis = require("../config/redis");

/**
 * Hybrid Rate Limiter
 * - uses IP for unaunthenticated users
 * - Uses UserId for authenticated Users
 */



const rateLimiter = ({
    windowSeconds,
    maxRequests, 
    keyPrefix,
    allowlistIPs = [],
    allowlistUsers = []
}) => {
    return async (req, res, next) =>{
        try
        {

            if(req.role?.role ==="admin")
            {
                return next();
            }

            //Allowlist Bypass
            const ip = req.ip || req.connection.remoteAddress;
            const userId = req.user?.id;

            if(allowlistIPs.includes(ip))
            {
                return next();
            }

            if(userId && allowlistUsers.includes(userId))
            {
                return next();
            }

            //Build rate-limit key

            const identifier = req.user?.id || req.ip;
            
            const redisKey = `${keyPrefix}:${identifier}`;

            // Increment counter
            const current = await redis.incr(redisKey);

            if(current === 1)
            {
                await redis.expire(redisKey, windowSeconds);
            }

            const ttl = await redis.ttl(redisKey);

            //Rate Limit headers
            res.setHeader("X-RateLimit-Limit", maxRequests)
            res.setHeader("X-RateLimit-Remaining", Math.max(maxRequests - current, 0));
            res.setHeader("X-RateLimit-Reset", Math.floor(Date.now() / 1000) + ttl);

            if(current > maxRequests) {
                return res.status(429).json({
                    error: "Too Many requests. Please try again later."
                });
            }

            next();

        }catch(err)
        {
            console.error("Rate Limiter Error:", err.message);
            next();
        }
    };
};

module.exports = rateLimiter;