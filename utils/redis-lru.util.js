const redis= require("redis");
const {log} = require("./logger.util");

const startRedisLRMMonitor = async () => {
    try
    {
        const subscriber = redis.createClient({
            url : process.env.REDIS_URL || "redis://127.0.0.1"
        });

        subscriber.on("error", (err) => {
            log("error", "redis LRU subscriber error", { error : err.message});
        });

        await subscriber.connect();

        await subscriber.subscribe("__keyevent@0__:evicted", (key) => {
            log("info", "redis key evicted due to LRU", {key});
            
        });
        log("info", "Redis LRU evection monitor started");


    }catch(err)
    {
        log("error", "Failed to start Redis LRU montor", {error: err.message});
    }
};

module.exports = startRedisLRMMonitor;