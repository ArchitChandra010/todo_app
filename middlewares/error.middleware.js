module.exports = (err, req, res, next) => {
    console.error("Error Middleware:", err);

    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    return res.status(statusCode).json({
        status: "error",
        message
    });
};