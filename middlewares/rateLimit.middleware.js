const redis = require("../config/redis");

/**
 * Hybrid Rate Limiter
 * - uses IP for unaunthenticated users
 * - Uses UserId for authenticated Users
 */

const rateLimiter = ({
    windowSeconds,
    maxRequests, 
    keyPrefix
}) => {
    return async (req, res, next) =>{
        try
        {
            const identifier = req.user?.id || req.ip;
            
            const redisKey = `${keyPrefix}:${identifier}`;

            const current = await redis.incr(redisKey);

            if(current === 1)
            {
                await redis.expire(redisKey, windowSeconds);
            }

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