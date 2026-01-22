const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: "upload/tasks",
    filename: (req, res, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniique + path.extname(File.orignalname));
    }
});


const fileFilter = (req, res, cb) => {
    if(!file.mimetype.startWith("image/")) {
        return cb(new Error("Only images allowed"), false);
    }
    cb(null, true);
};

module.exports = multer({
    storage, 
    fileFilter,
    limit: { fileSize: 5 * 1024 * 1024}
});