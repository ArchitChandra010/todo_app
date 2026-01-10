module.exports = (err, req, res, next) => {
    console.error("Error Middleware:", err.message);

    // console.error(err.stack);

    // const statusCode = err.statusCode || 500;
    // const message = err.message || "Internal Server Error";

    return res.status(err.statusCode|| 500).json({
        status: "error",
        message : err.message || "Internal Server Error"
    });
};