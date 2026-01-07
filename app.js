const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User.model');
const Task = require('./models/Task.model');
const authMiddleware = require('./middlewares/auth.middlewares');
const { createTaskSchema, updateTaskSchema } = require('./validations/task.validation');
const errorHandler = require('./middlewares/error.middleware');

require('dotenv').config();

// Initialize app
const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;
const MONGOURL = process.env.MONGODB_URL;

// Utility
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Connect to DB
mongoose.connect(MONGOURL)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error("DB Connection Error:", err);
    process.exit();
  });


// -------------------------
// AUTH ROUTES
// -------------------------

app.post('/auth/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      const err = new Error("Name, email, password are required");
      err.statusCode = 400;
      return next(err);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const err = new Error("Email already registered");
      err.statusCode = 409;
      return next(err);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "user"
    });

    const savedUser = await user.save();

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role
      }
    });

  } catch (error) {
    next(error);
  }
});


app.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error("Email and password required");
      err.statusCode = 400;
      return next(err);
    }

    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error("Invalid credentials");
      err.statusCode = 401;
      return next(err);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const err = new Error("Invalid credentials");
      err.statusCode = 401;
      return next(err);
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
});


// -------------------------
// TASK ROUTES
// -------------------------

// Create Task
app.post('/tasks', authMiddleware, async (req, res, next) => {
  try {
    const { error, value } = createTaskSchema.validate(req.body);

    if (error) {
      const errObj = new Error(error.details[0].message);
      errObj.statusCode = 400;
      return next(errObj);
    }

    const task = new Task({
      ...value,
      owner: req.user.id
    });

    const saved = await task.save();
    return res.status(201).json(saved);

  } catch (err) {
    next(err);
  }
});


// Get tasks for user
app.get('/tasks', authMiddleware, async (req, res, next) => {
  try {
    const filter = { owner: req.user.id };

    if (req.query.completed !== undefined) {
      filter.completed = req.query.completed === 'true';
    }

    const tasks = await Task.find(filter);
    return res.json(tasks);

  } catch (err) {
    next(err);
  }
});


// Update Task (PATCH)
app.patch('/tasks/:id', authMiddleware, async (req, res, next) => {
  try {
    const taskId = req.params.id;

    if (!isValidObjectId(taskId)) {
      const err = new Error("Invalid task ID");
      err.statusCode = 400;
      return next(err);
    }

    const { error, value } = updateTaskSchema.validate(req.body);
    if (error) {
      const errObj = new Error(error.details[0].message);
      errObj.statusCode = 400;
      return next(errObj);
    }

    const task = await Task.findOneAndUpdate(
      { _id: taskId, owner: req.user.id },
      { $set: value },
      { new: true }
    );

    if (!task) {
      const err = new Error("Task not found or unauthorized");
      err.statusCode = 404;
      return next(err);
    }

    return res.json(task);

  } catch (err) {
    next(err);
  }
});


// Toggle Task Completed
app.patch('/tasks/:id/toggle', authMiddleware, async (req, res, next) => {
  try {
    const taskId = req.params.id;

    if (!isValidObjectId(taskId)) {
      const err = new Error("Invalid task ID");
      err.statusCode = 400;
      return next(err);
    }

    const { error, value } = updateTaskSchema.validate(req.body);
    if (error) {
      const errObj = new Error(error.details[0].message);
      errObj.statusCode = 400;
      return next(errObj);
    }

    const task = await Task.findOne({ _id: taskId, owner: req.user.id });

    if (!task) {
      const err = new Error("Task not found or unauthorized");
      err.statusCode = 404;
      return next(err);
    }

    // Correct toggle priority
    if (value.toggle === true) {
      task.completed = !task.completed;
    } else if (value.completed !== undefined) {
      task.completed = value.completed;
    }

    if (value.title !== undefined) task.title = value.title;
    if (value.description !== undefined) task.description = value.description;

    await task.save();

    return res.json({
      message: "Task updated/toggled",
      task
    });

  } catch (err) {
    next(err);
  }
});


// Delete Task
app.delete('/tasks/:id', authMiddleware, async (req, res, next) => {
  try {
    const taskId = req.params.id;

    if (!isValidObjectId(taskId)) {
      const err = new Error("Invalid task ID");
      err.statusCode = 400;
      return next(err);
    }

    const task = await Task.findOneAndDelete({
      _id: taskId,
      owner: req.user.id
    });

    if (!task) {
      const err = new Error("Task not found or unauthorized");
      err.statusCode = 404;
      return next(err);
    }

    return res.json({ message: "Task deleted" });

  } catch (err) {
    next(err);
  }
});


// Admin toggle any task
app.patch('/admin/tasks/:id/toggle', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      const err = new Error("Admin access required");
      err.statusCode = 403;
      return next(err);
    }

    const taskId = req.params.id;

    if (!isValidObjectId(taskId)) {
      const err = new Error("Invalid task ID format");
      err.statusCode = 400;
      return next(err);
    }

    const task = await Task.findById(taskId);
    if (!task) {
      const errObj = new Error("Task not found");
      errObj.statusCode = 404;
      return next(errObj);
    }

    task.completed = !task.completed;
    await task.save();

    return res.json({
      message: "Admin toggled task",
      task
    });

  } catch (err) {
    next(err);
  }
});


// Error Handler (last)
app.use(errorHandler);
