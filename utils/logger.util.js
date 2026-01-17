const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../logs");
const MAX_LOG_SIZE = 10 * 1024 * 1024;

if(!fs.existsSync(LOG_DIR))
{
    fs.mkdirSync(LOG_DIR);
}

const getLogFilePath = () => {
    const date = new Date().toISOString().split("T")[0];
    return path.join(LOG_DIR, `redis-${date}.log`);
};

const rotateIfNeeded = (filePath) => {
    if(fs.existsSync(filePath)) 
    {
        const {size} = fs.statSync(filePath);
        if(size >= MAX_LOG_SIZE)
        {
            const rotatedName= filePath.replace(
                ".log",
                '-${date.now()}.log'
            );
            fs.renameSync(filePath , rotatedName);
        }
    }
};



exports.log  = (level, message , meta = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${level.toUpperCase()}] ${message}`, meta);
    const logEntry = JSON.stringify({
        timestamp,
        level,
        message,
        ...meta
    }) + "\n";

    const filePath = getLogFilePath();
    rotateIfNeeded(filePath);

    fs.appendFileSync(filePath, logEntry);

    console.log(`[${level.toUpperCase()}]`, message , meta);
};