const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const taskRoutes = require("./routes/task.routes");
const errorHandler = require("./middlewares/error.middleware");
const startRedisLRMMonitor = require("./utils/redis-lru.util");
startRedisLRMMonitor();

const app = express();

app.use(bodyParser.json());

// ROUTES
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

// GLOBAL ERROR HANDLER
app.use(errorHandler);

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("DB Connected"))
  .catch((err) => console.error(err));

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);

module.exports = app;
