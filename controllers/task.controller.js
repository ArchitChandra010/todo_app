const Task = require("../models/Task.model");
const mongoose = require("mongoose");
const redisClient = require("../config/redis");
const { createTaskSchema, updateTaskSchema } = require("../validations/task.validation");
const { invalidateTaskCache } = require("../utils/cache.util");

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
        //Redis flush
        await invalidateTaskCache(req.user.id);

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


        const task = await Task.findOne({
            _id: taskId, 
            $or: [
                {owner: req.user.id},
                {collaborators: req.user.id}
            ]
        });

        if(!task)
        {
            const error = new Error("Task not found");
            error.statusCode = 404;
            return next(error);
        }

        // apply toggle/update logic
       if(value.toggle === true){
        task.completed = !task.completed;
       }
       else{
        if(value.completed !== undefined) task.completed = value.completed;
        if(value.title !== undefined) task.title = value.title;
        if(value.description !== undefined) task.description = value.description;
       }

        //Redis flush
        // await redisClient.flushAll();
        await task.save();

        await invalidateTaskCache(req.user.id);

        return res.json({
            message : "Task updated successfully",
            task}
        );

       
    }catch(error)
    {
        next(error);
    }
};


// DELETE TASK
exports.deleteTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      const err = new Error("Invalid task ID");
      err.statusCode = 400;
      return next(err);
    }

    const task = await Task.findOne({
      _id: req.params.id,
      $or: [
        {owner: req.user.id},
        {collaborators: req.user.id}
      ]
    });

    

    if (!task) {
      const err = new Error("Task not found or unauthorized");
      err.statusCode = 404;
      return next(err);
    }

    if(!task.owner.equals(req.user.id)) {
        const err = new Error("Only owner can delete task");
        err.statusCode = 403;
        return next(err);
    }

    await task.deleteOne();

    //Redis flush
    // await redisClient.flushAll();
    await invalidateTaskCache(req.user.id);

    return res.json({ message: "Task Deleted Successfully" });

  } catch (err) {
    next(err);
  }
};

exports.filterTasks = async (req, res, next) => {
    try
    {
        const UserId = req.user.id;
        
        const {
        completed,
        priority,
        tags,
        mode = "any",
        dueBefore,
        dueAfter,
        search,
        sortBy = "createdAt",
        order = "desc",
        page = 1,
        limit = 10
        } = req.query;

        //Create Cached key based on User + all query params
        const cacheKey = `tasks:${UserId}:${JSON.stringify(req.query)}`;

        //try to retrive cached result
        const cached = await redisClient.get(cacheKey);
        if(cached)
        {
            console.log("Returning from Redis Cache");
            return res.json(JSON.parse(cached));
        }

        //Build match stage for aggragation
        const matchStage = {
            $or:
            [
                {owner : new mongoose.Types.ObjectId(UserId)},
                {collaborators: new mongoose.Types.ObjectId(UserId)}
            ]
        };
        //Completed filter
        if(completed !== undefined)
            matchStage.completed = completed === "true";

        //Priority filter
        if(priority)
            matchStage.priority = priority;

        //Tags filter
        if(tags)
        {
            const tagList = tags.split(",");

            if(mode === "all")
                matchStage.tags = { $all: tagList };
            else
                matchStage.tags = { $in: tagList };
        }


        //date filters
        if(dueBefore || dueAfter)
        {
            matchStage.dueDate = {};
            if(dueAfter)
                matchStage.dueDate.$gte = new Date(dueAfter);
            if(dueBefore)
                matchStage.dueDate.$lte = new Date(dueBefore);
        }

        //Full text Search
        if(search)
        {
            matchStage.$or = [
                { title : { $regex : search, $options: 'i' } },
                { description : { $regex : search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const pipeline = [
            { $match: matchStage },
            { $sort: { [sortBy]: order === "desc" ? -1 : 1 } },
            { $skip: skip },
            { $limit: parseInt(limit)}
        ];

        //RUN PIPELINE
        const tasks = await Task.aggregate(pipeline);

        //Count total for pagination info
        const totalCount = await Task.countDocuments(matchStage);

        const response = {
            page: parseInt(page),
            limit : parseInt(limit),
            totalTasks: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            tasks
        };

        await redisClient.set(cacheKey, JSON.stringify(response), {
            EX: 300 //TTL=300 SECONDS(5MIN)
        });

        console.log(" Saved to Redis Cache");

        return res.json(response);


    }catch(error)
    {
        next(error);
    }
};


exports.redis_test =  async (req, res) => {
  try {
    await redisClient.set("test", "hello");
    const value = await redisClient.get("test");
    res.json({ message: value });
  } catch (err) {
    next(err);
  }
};


exports.addCollaborator = async (req, res, next) => {
    try
    {
        const {userId} = req.body;
        const taskId = req.params.id;
        
        if(!mongoose.Types.ObjectId.isValid(taskId))
        {
            const err = new Error("Invalid Task ID");
            err.statusCode = 400;
            return next(err);
        }

        const task = await Task.findOne({
            _id : taskId,
            owner: req.user.id
        });

        if(!task)
        {
            throw Object.assign(new Error("Task not found or Unauthorized"), { statusCode: 404});
        }

        if(!task.collaborators.includes(userId))
        {
            task.collaborators.push(userId);
            await task.save();
        }

        await invalidateTaskCache(req.user.id);

        return res.json({ message: "Collaborator added", task});

    }catch(error)
    {
        next(error);
    }
};


exports.uploadAttachment = async (req, res, next) => {
    try 
    {
        const taskId = req.params.id;

        if(!mongoose.Types.ObjectId.isValid(taskId))
        {
            const err = new Error("Invalid Task ID");
            err.statusCode = 400;
            return next(err);
        }

        const task = await Task.findOneAndDelete({
            _id : taskId,
            $or: [
                {owner : req.user.id},
                {collaborators: req.user.id}
            ]
        });

        if(!task)
        {
            throw Object.assign(new Error("Task not Found"), {statusCode : 404});
        }

        task.attachments.push({
            filename : req.file.filename,
            url: `/upload/tasks/${req.file.filename}`,
            mimeType: req.file.mimeType,
            size: req.file.size
        });

        await task.save();

        await invalidateTaskCache(req.user.id);

        return res.json({ message : "Attachment Uploaded", task});
    }catch(error)
    {
        next(error);
    }
};