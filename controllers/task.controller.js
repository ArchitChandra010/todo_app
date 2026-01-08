const Task = require("../models/Task.model");
const mongoose = require("mongoose");
const { createTaskSchema, updateTaskSchema } = require("../validations/task.validation");

// Create Task
exports.createTask = async (req,res,next) => 
{
    try
    {
        const { error , value } = createTaskSchema.validate(req.body);

        if(error)
        {
            const err = new Error(error.details[0].message);
            err.statusCode = 400;
            return next(err);
        }

        const task = await Task.create({
            ...value,
            owner: req.user.id,

        });
        return res.status(201).json({
            message: "Task created successfully",
            task
        });
    }catch(error)
    {
        next(error);
    }
};


exports.getTasks = async (req,res,next) =>
{
    try
    {
        const tasks = await Task.find({ owner: req.user.id });
        res.json(tasks);
    }
    catch(error)
    {
        next(error);
    }
};


exports.toggleTask = async (req, res, next) =>
{
    try
    {
        const taskId = req.params.id;

        if(!mongoose.Types.ObjectId.isValid(taskId))
        {
            const error = new Error("Invalid Task ID");
            error.statusCode = 400;
            return next(error);
        }
        const {error , value} = updateTaskSchema.validate(req.body);
        if(error)
        {
            const err = new Error(error.details[0].message);
            err.statusCode = 400;
            return next(err);
        }


        const task = await Task.findOne({_id: taskId, owner: req.user.id});
        if(!task)
        {
            const error = new Error("Task not found");
            error.statusCode = 404;
            return next(error);
        }

       if(value.toggle){
        task.completed = !task.completed;
       }
       else{
        if(value.completed !== undefined) task.completed = value.completed;
        if(value.title) task.title = value.title;
        if(value.description) task.description = value.description;
       }

       await task.save();
        return res.json(task);

       
    }catch(error)
    {
        next(error);
    }
};


// DELETE TASK
exports.deleteTask = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      const err = new Error("Invalid task ID");
      err.statusCode = 400;
      return next(err);
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
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
};