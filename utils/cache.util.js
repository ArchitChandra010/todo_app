const redis = require("../config/redis");


exports.invalidateTaskCache = async (userId) => {
    try
    {
        //pattern for keys created in filter
        const pattern = `tasks:${userId}:*`;
        let cursor = "0";
        const keysToDelete = [];

        do{
            const result = await redis.scan(cursor , {
                MATCH: pattern,
                COUNT: 100
            });
            cursor = result.cursor;
            keysToDelete.push(...result.keys);
        }while(cursor !== "0");


        //get all keys
        // const keys = await redis.keys(pattern);

        if(keysToDelete.length > 0 )
        {
            await redis.del(keysToDelete);
            console.log(`Redis cache invalidated for users: ${userId}`);
        }
    }catch( err)
    {
        console.error("Redis invalidation Error:", err.message);
    }
};

