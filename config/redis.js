const redis = require("redis");

let client;

(async () => {
    client = redis.createClient({
        url : process.env.REDIS_URL || "redis://127.0.0.1"
    });

    client.on("error", (err) => console.error("Redis Error: ", err));

    await client.connect();
})();

// module.exports = {
//     get: (...args) => client.get(...args),
//     set: (...args) => client.set(...args),
//     del: (...args) => client.del(...args),
//     flushAll: (...args) => client.flushAll(...args),

// };

module.exports = client;